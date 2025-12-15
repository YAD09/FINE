
import React, { useState, useRef } from 'react';
import { User, VerificationStatus, AvailabilityStatus } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { Camera, CheckCircle, Shield, Mail, School, User as UserIcon, Upload, AlertCircle, Clock, Download, Briefcase, Plus, Image as ImageIcon } from 'lucide-react';
import { API } from '../services/api';

interface ProfileProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [college, setCollege] = useState(user.college);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const [bio, setBio] = useState("Student at " + user.college);
  const [availability, setAvailability] = useState<AvailabilityStatus>(user.availability || AvailabilityStatus.ONLINE);
  
  // Portfolio
  const [portfolioItems, setPortfolioItems] = useState<string[]>([
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&h=200&fit=crop"
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size is too large. Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsLoading(true);
          const reader = new FileReader();
          reader.onloadend = async () => {
              try {
                  const updatedUser = await API.auth.submitVerification(user.id, reader.result as string);
                  onUpdateProfile(updatedUser);
                  alert("Verification document submitted! Admin will review shortly.");
              } catch (e) {
                  console.error(e);
                  alert("Failed to upload document");
              } finally {
                  setIsLoading(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPortfolioItems(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const updatedUser = {
        ...user,
        name,
        email,
        college,
        avatarUrl: avatarPreview,
        availability
      };
      onUpdateProfile(updatedUser);
      setIsLoading(false);
      alert("Profile updated successfully!");
    }, 1000);
  };

  const handleDownloadPlacementReport = () => {
      const data = `
      TASKLINK PLACEMENT REPORT
      -------------------------
      Name: ${user.name}
      College: ${user.college}
      
      Skills Proven: 
      - Reliability: ${user.tasksCompleted > 10 ? 'High' : 'Medium'}
      - Rating: ${user.rating}/5.0
      
      Tasks Completed: ${user.tasksCompleted}
      Verified Student: ${user.verified ? 'Yes' : 'No'}
      `;
      
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.name.replace(' ','_')}_Placement_Report.txt`;
      a.click();
  };

  const renderVerificationStatus = () => {
      switch(user.verificationStatus) {
          case VerificationStatus.VERIFIED:
              return (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                      <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full text-green-600 dark:text-green-400"><CheckCircle className="w-5 h-5"/></div>
                      <div>
                          <p className="font-bold text-green-700 dark:text-green-400">Identity Verified</p>
                          <p className="text-xs text-green-600 dark:text-green-500">You can post verification-required tasks.</p>
                      </div>
                  </div>
              );
          case VerificationStatus.PENDING:
              return (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full text-amber-600 dark:text-amber-400"><Clock className="w-5 h-5"/></div>
                    <div>
                        <p className="font-bold text-amber-700 dark:text-amber-400">Verification Pending</p>
                        <p className="text-xs text-amber-600 dark:text-amber-500">Admin is reviewing your document.</p>
                    </div>
                </div>
              );
          case VerificationStatus.REJECTED:
              return (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full text-red-600 dark:text-red-400"><AlertCircle className="w-5 h-5"/></div>
                        <p className="font-bold text-red-700 dark:text-red-400">Verification Rejected</p>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mb-3">Please upload a clear Student ID card.</p>
                    <Button size="sm" variant="danger" onClick={() => docInputRef.current?.click()}>Try Again</Button>
                </div>
              );
          default:
              return (
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Verify Student Status</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Upload your Student ID card to unlock verified badge and more features.</p>
                    <input type="file" ref={docInputRef} onChange={handleDocUpload} accept="image/*" className="hidden" />
                    <Button size="sm" variant="outline" className="w-full" onClick={() => docInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Upload ID Card
                    </Button>
                </div>
              );
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <Button variant="outline" onClick={handleDownloadPlacementReport} size="sm">
            <Download className="w-4 h-4 mr-2" /> Placement Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Identity Card */}
        <div className="space-y-6">
          <Card className="p-6 flex flex-col items-center text-center">
            <div 
              className="relative mb-4 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <img 
                src={avatarPreview || user.avatarUrl} 
                alt={user.name} 
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 dark:border-slate-800 shadow-md bg-slate-200 dark:bg-slate-700"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">{user.username}</p>
            
            {user.verified && (
              <Badge color="green">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Verified Student
                </span>
              </Badge>
            )}

            <div className="w-full grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
               <div>
                 <p className="text-2xl font-bold text-slate-800 dark:text-white">{user.rating}</p>
                 <p className="text-xs text-slate-400 uppercase font-bold">Rating</p>
               </div>
               <div>
                 <p className="text-2xl font-bold text-slate-800 dark:text-white">{user.tasksCompleted}</p>
                 <p className="text-xs text-slate-400 uppercase font-bold">Tasks Done</p>
               </div>
            </div>
          </Card>

          <Card className="p-6">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4">Verification</h3>
             {renderVerificationStatus()}
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Edit Details</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Availability Status</label>
                  <div className="grid grid-cols-3 gap-3">
                      {[AvailabilityStatus.ONLINE, AvailabilityStatus.BUSY, AvailabilityStatus.URGENT_ONLY].map((stat) => (
                          <button
                            key={stat}
                            type="button"
                            onClick={() => setAvailability(stat)}
                            className={`p-2 rounded-lg text-xs font-bold border-2 transition-all capitalize ${availability === stat ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                          >
                              {stat.toLowerCase().replace('_', ' ')}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input 
                   label="Full Name"
                   value={name}
                   onChange={e => setName(e.target.value)}
                   icon={<UserIcon className="w-4 h-4" />}
                 />
                 <div className="opacity-70">
                    <Input 
                      label="Username"
                      value={user.username}
                      readOnly
                      disabled
                      className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Username cannot be changed.</p>
                 </div>
              </div>

              <Input 
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
              />

              <Input 
                label="College / University"
                value={college}
                onChange={e => setCollege(e.target.value)}
                icon={<School className="w-4 h-4" />}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Bio</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900 transition-colors outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                 <Button type="button" variant="ghost">Cancel</Button>
                 <Button type="submit" isLoading={isLoading}>Save Changes</Button>
              </div>
            </form>
          </Card>

          {/* Portfolio Builder */}
          <Card className="p-8">
              <div className="flex justify-between items-center mb-4">
                  <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Portfolio</h3>
                      <p className="text-xs text-slate-500">Showcase your best work to get hired faster.</p>
                  </div>
                  <input type="file" ref={portfolioInputRef} onChange={handlePortfolioUpload} className="hidden" accept="image/*" />
                  <Button size="sm" variant="secondary" onClick={() => portfolioInputRef.current?.click()}>
                      <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {portfolioItems.map((src, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative group">
                          <img src={src} className="w-full h-full object-cover" alt="portfolio" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                      </div>
                  ))}
                  <button onClick={() => portfolioInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-primary-500 hover:text-primary-500 transition-colors">
                      <Plus className="w-6 h-6" />
                  </button>
              </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

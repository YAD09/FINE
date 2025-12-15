
import React from 'react';
import { Card, Button, Badge } from '../components/UI';
import { User, Task, TaskStatus } from '../types';
import { Link } from 'react-router-dom';
import { Wallet, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface DashboardProps {
  user: User;
  tasks: Task[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, tasks }) => {
  // Filter relevant tasks
  const myPostedTasks = tasks.filter(t => t.posterId === user.id);
  const myActiveTasks = tasks.filter(t => t.executorId === user.id && t.status === TaskStatus.IN_PROGRESS);

  const stats = [
    { label: 'Wallet Balance', value: `₹${Number(user.balance || 0).toFixed(2)}`, icon: Wallet, color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' },
    { label: 'In Escrow', value: `₹${Number(user.escrowBalance || 0).toFixed(2)}`, icon: Clock, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
    { label: 'Tasks Done', value: user.tasksCompleted || 0, icon: CheckCircle, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hello, {user.name?.split(' ')[0] || 'Student'} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400">Here's what's happening with your tasks today.</p>
        </div>
        <Link to="/post">
          <Button size="lg" className="shadow-primary-300 dark:shadow-none shadow-xl">
             <span className="text-lg mr-1">+</span> Post a New Task
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Working Tasks */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tasks You're Doing</h2>
             <Link to="/tasks" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">Find more</Link>
          </div>
          {myActiveTasks.length === 0 ? (
            <Card className="p-8 text-center bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 mb-4">You aren't working on any tasks right now.</p>
              <Link to="/tasks"><Button variant="secondary">Browse Opportunities</Button></Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {myActiveTasks.map(task => (
                <Card key={task.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">{task.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Due: {new Date(task.deadline).toLocaleDateString()}</p>
                    </div>
                    <Badge color="blue">In Progress</Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-slate-50 dark:border-slate-800 pt-3">
                    <span className="font-bold text-green-600 dark:text-green-400">₹{task.budget}</span>
                    <Link to={`/tasks/${task.id}`}>
                      <Button size="sm" variant="outline">View Details</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* My Posted Tasks */}
        <section>
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your Posted Tasks</h2>
             <Link to="/post" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">Create new</Link>
          </div>
           {myPostedTasks.length === 0 ? (
            <Card className="p-8 text-center bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't posted any tasks yet.</p>
              <Link to="/post"><Button variant="primary">Post a Task</Button></Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {myPostedTasks.slice(0, 3).map(task => (
                <Card key={task.id} className="p-4">
                   <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{task.offers?.length || 0} offers</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-xs text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge color={task.status === 'OPEN' ? 'green' : 'gray'}>{task.status}</Badge>
                  </div>
                  <Link to={`/tasks/${task.id}`} className="flex items-center text-sm text-primary-600 dark:text-primary-400 font-medium mt-3 hover:underline">
                    Manage Task <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit, Shield, Key, Users as UsersIcon } from '@/lib/icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'VIEWER';
  totpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sessions: number;
  };
}

const ROLE_COLORS = {
  OWNER: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  ADMIN: 'bg-red-500/20 text-red-500 border-red-500/30',
  MODERATOR: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  VIEWER: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
};

const ROLE_DESCRIPTIONS = {
  OWNER: 'Full system access including user management and JVM config',
  ADMIN: 'Server management, mods, settings, console access',
  MODERATOR: 'Console access, monitoring, read-only analytics',
  VIEWER: 'Dashboard view, server status, connection info',
};

export function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MODERATOR' | 'VIEWER'>('VIEWER');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!username || !password) {
      toast.error('Username and password are required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      setShowCreateDialog(false);
      setUsername('');
      setPassword('');
      setRole('VIEWER');
      await fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      toast.success('User updated successfully');
      setShowEditDialog(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setRole(user.role === 'OWNER' ? 'ADMIN' : user.role);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Users</h2>
          <p className="text-sm text-gray-400">{users.length} total users</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Role Explanation */}
      <Card className="p-6 bg-[#0C1222] border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
            <div key={role} className="flex items-start gap-3">
              <Badge className={ROLE_COLORS[role as keyof typeof ROLE_COLORS]}>
                {role}
              </Badge>
              <p className="text-sm text-gray-400 flex-1">{description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="p-4 bg-[#0C1222] border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#00D4AA]/10">
                    <UsersIcon className="w-5 h-5 text-[#00D4AA]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{user.username}</h4>
                      <Badge className={ROLE_COLORS[user.role]}>{user.role}</Badge>
                      {user.totpEnabled && (
                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                          <Key className="w-3 h-3 mr-1" />
                          2FA
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>
                        Created {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                      {user._count && (
                        <>
                          <span>•</span>
                          <span>{user._count.sessions} active sessions</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {user.role !== 'OWNER' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(user)}
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#0C1222] border-gray-800">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new user to the HyFern dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-[#1a1f35] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-[#1a1f35] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1a1f35] border border-gray-700 rounded-md text-white"
              >
                <option value="VIEWER">Viewer</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={submitting}
              className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#0C1222] border-gray-800">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update role for {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#1a1f35] border border-gray-700 rounded-md text-white"
              >
                <option value="VIEWER">Viewer</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={submitting}
              className="bg-[#00D4AA] hover:bg-[#00D4AA]/90 text-[#0C1222]"
            >
              {submitting ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#0C1222] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-red-500">Delete User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {selectedUser?.username}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {submitting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

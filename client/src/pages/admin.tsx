import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, UserCog, Users, ArrowLeft, Settings, LogOut, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Admin() {
  const [showForm, setShowForm] = useState(false);
  const [showSuperAdminForm, setShowSuperAdminForm] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState("");
  const [superAdminPassword, setSuperAdminPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      isAdmin: false,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      return apiRequest('POST', '/api/admin/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      form.reset();
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const createSuperAdminMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return apiRequest('POST', '/api/admin/super-admin', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "Super admin created/updated successfully. These credentials will be used for production deployment.",
      });
      setSuperAdminEmail("");
      setSuperAdminPassword("");
      setShowSuperAdminForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create super admin",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    createUserMutation.mutate(data);
  };

  const handleSuperAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!superAdminEmail || !superAdminPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    if (superAdminPassword.length < 8) {
      toast({
        title: "Error", 
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    createSuperAdminMutation.mutate({ email: superAdminEmail, password: superAdminPassword });
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCog className="text-white" size={16} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Admin Panel</h1>
                <p className="text-xs text-slate-500 hidden sm:block">User Management</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-1 sm:space-x-4">
              {/* Mobile Menu */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-2">
                      <Settings size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center">
                        <ArrowLeft className="mr-2" size={14} />
                        Back to Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {user?.email}
                      <span className="text-xs text-blue-600 block">Admin</span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2" size={14} />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop Navigation */}
              <Link 
                href="/" 
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex px-2">
                    <Settings size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.email}
                    {user?.isAdmin && <span className="text-xs text-blue-600 block">Admin</span>}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2" size={14} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Add User Form */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Plus className="mr-2 text-primary" size={18} />
                    Add New User
                  </CardTitle>
                  <CardDescription className="text-sm">Create user accounts and set their permissions</CardDescription>
                </div>
                <Button onClick={() => setShowForm(!showForm)} size="sm" className="w-full sm:w-auto">
                  {showForm ? "Cancel" : "Add User"}
                </Button>
              </div>
            </CardHeader>
            {showForm && (
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="isAdmin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User Role</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="false">Regular User</SelectItem>
                              <SelectItem value="true">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createUserMutation.isPending} className="w-full sm:w-auto">
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            )}
          </Card>

          {/* Super Admin Section */}
          <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <CardTitle className="flex items-center text-orange-800 text-lg sm:text-xl">
                    <Shield className="mr-2 text-orange-600" size={18} />
                    Production Super Admin
                  </CardTitle>
                  <CardDescription className="text-orange-700 text-sm">
                    Set up super admin credentials for production deployment. These will be used when the app is deployed.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowSuperAdminForm(!showSuperAdminForm)}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-800 hover:bg-orange-100 w-full sm:w-auto"
                >
                  {showSuperAdminForm ? "Cancel" : "Set Credentials"}
                </Button>
              </div>
            </CardHeader>
            {showSuperAdminForm && (
              <CardContent>
                <form onSubmit={handleSuperAdminSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="superAdminEmail">Super Admin Email *</Label>
                      <Input
                        id="superAdminEmail"
                        type="email"
                        placeholder="superadmin@yourcompany.com"
                        value={superAdminEmail}
                        onChange={(e) => setSuperAdminEmail(e.target.value)}
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="superAdminPassword">Super Admin Password *</Label>
                      <Input
                        id="superAdminPassword"
                        type="password"
                        placeholder="Strong password (8+ characters)"
                        value={superAdminPassword}
                        onChange={(e) => setSuperAdminPassword(e.target.value)}
                        className="border-orange-200 focus:border-orange-400"
                      />
                    </div>
                  </div>
                  <div className="bg-orange-100 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Shield className="text-orange-600 mt-0.5" size={16} />
                      <div className="text-sm text-orange-800">
                        <p className="font-medium mb-1">Important:</p>
                        <ul className="list-disc list-inside space-y-1 text-orange-700">
                          <li>These credentials will be used for production database access</li>
                          <li>The super admin can manage all users and access all data</li>
                          <li>Use a strong, unique password for security</li>
                          <li>Store these credentials securely after deployment</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowSuperAdminForm(false)}
                      className="border-orange-300 text-orange-800 hover:bg-orange-100 w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createSuperAdminMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
                    >
                      {createSuperAdminMutation.isPending ? "Setting..." : "Set Super Admin"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Users className="mr-2 text-primary" size={18} />
                Users ({users?.length || 0})
              </CardTitle>
              <CardDescription className="text-sm">Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : users && users.length > 0 ? (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.isAdmin ? "default" : "secondary"}>
                                {user.isAdmin ? "Administrator" : "User"}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 size={14} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.email}? This action cannot be undone
                                      and will delete all of their shooting sessions.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {users.map((user) => (
                      <Card key={user.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-slate-900 truncate">{user.email}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={user.isAdmin ? "default" : "secondary"} className="text-xs">
                                {user.isAdmin ? "Admin" : "User"}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 ml-2">
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.email}? This action cannot be undone
                                  and will delete all of their shooting sessions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No users found. Create the first user to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
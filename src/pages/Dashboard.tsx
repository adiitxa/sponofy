import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartLegend } from "@/components/ui/chart";
import { 
  AreaChart, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Area, 
  Bar, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector
} from "recharts";
import { Phone, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClientRequest {
  id: string;
  name: string;
  email: string;
  project_name: string;
  category: string;
  amount: number;
  status: string;
  created_at: string;
  phone: string;
  age: number | null;
  gender: string;
  language: string;
  city: string;
  social_platform: string;
  followers_count: string;
  social_link: string;
}

interface CompanyOffer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  industry: string;
  budget: number;
  status: string;
  created_at: string;
  phone: string | null;
}

interface StatsData {
  total_users: number;
  active_sponsors: number;
  completed_sponsorships: number;
}

interface MonthlyStats {
  month: string;
  clientRequests: number;
  companyOffers: number;
}

interface CategoryStats {
  name: string;
  count: number;
  color?: string;
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsData>({
    total_users: 0,
    active_sponsors: 0,
    completed_sponsorships: 0
  });
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [companyOffers, setCompanyOffers] = useState<CompanyOffer[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, isClient: boolean} | null>(null);
  
  const [activeIndex, setActiveIndex] = useState(0);
  
  const [currentClientPage, setCurrentClientPage] = useState(1);
  const [currentCompanyPage, setCurrentCompanyPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single();

      if (statsError) {
        console.error('Error fetching stats:', statsError);
      } else {
        setStatsData(statsData as StatsData);
      }

      const { data: clientData, error: clientError } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientError) {
        console.error('Error fetching client requests:', clientError);
      } else {
        setClientRequests(clientData as ClientRequest[]);
        
        const categoriesObj = clientData.reduce((acc: Record<string, number>, item: ClientRequest) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {});
        
        const categoryStatsArray: CategoryStats[] = Object.keys(categoriesObj).map((key, index) => ({
          name: key,
          count: categoriesObj[key],
          color: COLORS[index % COLORS.length]
        }));
        
        setCategoryStats(categoryStatsArray);
      }

      const { data: companyData, error: companyError } = await supabase
        .from('company_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyError) {
        console.error('Error fetching company offers:', companyError);
      } else {
        setCompanyOffers(companyData as CompanyOffer[]);
        
        const categoriesObj = clientData?.reduce((acc: Record<string, number>, item: ClientRequest) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {}) || {};
        
        const industries = companyData.reduce((acc: Record<string, number>, item: CompanyOffer) => {
          acc[item.industry] = (acc[item.industry] || 0) + 1;
          return acc;
        }, {});
        
        const industryStatsArray: CategoryStats[] = Object.keys(industries).map((key, index) => ({
          name: key,
          count: industries[key],
          color: COLORS[(index + Object.keys(categoriesObj).length) % COLORS.length]
        }));
        
        setCategoryStats(prev => [...prev, ...industryStatsArray]);
      }
      
      generateMonthlyStats(clientData || [], companyData || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateMonthlyStats = (clientData: ClientRequest[], companyData: CompanyOffer[]) => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        month: month.toLocaleString('default', { month: 'short' }),
        date: month
      });
    }
    
    const monthlyData = months.map(monthObj => {
      const month = monthObj.date;
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      
      const clientCount = clientData.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= month && itemDate < nextMonth;
      }).length;
      
      const companyCount = companyData.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= month && itemDate < nextMonth;
      }).length;
      
      return {
        month: monthObj.month,
        clientRequests: clientCount,
        companyOffers: companyCount
      };
    });
    
    setMonthlyStats(monthlyData);
  };

  const handleStatusChange = async (id: string, newStatus: string, isClientRequest: boolean) => {
    try {
      const tableName = isClientRequest ? 'client_requests' : 'company_offers';
      const { error } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "The request status has been updated successfully.",
      });

      if (isClientRequest) {
        setClientRequests(prev => 
          prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
        );
        
        if (newStatus === 'completed') {
          const updatedStats = {
            ...statsData,
            completed_sponsorships: (statsData.completed_sponsorships || 0) + 1
          };
          
          setStatsData(updatedStats);
          
          await supabase
            .from('dashboard_stats')
            .update({
              completed_sponsorships: updatedStats.completed_sponsorships
            } as any)
            .eq('total_users', statsData.total_users);
        }
      } else {
        setCompanyOffers(prev => 
          prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
        );
        
        if (newStatus === 'completed') {
          const updatedStats = {
            ...statsData,
            completed_sponsorships: (statsData.completed_sponsorships || 0) + 1
          };
          
          setStatsData(updatedStats);
          
          await supabase
            .from('dashboard_stats')
            .update({
              completed_sponsorships: updatedStats.completed_sponsorships
            } as any)
            .eq('total_users', statsData.total_users);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update failed",
        description: "Failed to update the request status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, isClient: boolean) => {
    setItemToDelete({ id, isClient });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const { id, isClient } = itemToDelete;
    const tableName = isClient ? 'client_requests' : 'company_offers';
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Request deleted",
        description: "The request has been deleted successfully.",
      });

      if (isClient) {
        setClientRequests(prev => prev.filter(item => item.id !== id));
      } else {
        setCompanyOffers(prev => prev.filter(item => item.id !== id));
      }
      
      if (isClient && currentClientPage > Math.ceil((clientRequests.length - 1) / itemsPerPage)) {
        setCurrentClientPage(Math.max(1, currentClientPage - 1));
      }
      
      if (!isClient && currentCompanyPage > Math.ceil((companyOffers.length - 1) / itemsPerPage)) {
        setCurrentCompanyPage(Math.max(1, currentCompanyPage - 1));
      }
      
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the request.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const filterByDate = (date: string) => {
    const today = new Date();
    const startDate = new Date();
    
    switch(date) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "sixMonths":
        startDate.setMonth(today.getMonth() - 6);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return () => true;
    }
    
    return (item: ClientRequest | CompanyOffer) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= today;
    };
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value } = props;

    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={fill} className="text-sm font-medium">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#999" className="text-xs">
          Count: {value}
        </text>
        <text x={cx} y={cy} dy={25} textAnchor="middle" fill="#999" className="text-xs">
          {`(${(percent * 100).toFixed(0)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  const filteredClientRequests = clientRequests.filter(request => {
    const matchesSearch = searchTerm === "" || 
      request.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || request.category === categoryFilter;
    const dateFilterFn = filterByDate(dateFilter);
    const matchesDate = dateFilter === "all" || dateFilterFn(request);
    
    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  const filteredCompanyOffers = companyOffers.filter(offer => {
    const matchesSearch = searchTerm === "" || 
      offer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      offer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
    const matchesIndustry = categoryFilter === "all" || offer.industry === categoryFilter;
    const dateFilterFn = filterByDate(dateFilter);
    const matchesDate = dateFilter === "all" || dateFilterFn(offer);
    
    return matchesSearch && matchesStatus && matchesIndustry && matchesDate;
  });

  const indexOfLastClient = currentClientPage * itemsPerPage;
  const indexOfFirstClient = indexOfLastClient - itemsPerPage;
  const currentClientItems = filteredClientRequests.slice(indexOfFirstClient, indexOfLastClient);
  const totalClientPages = Math.ceil(filteredClientRequests.length / itemsPerPage);
  
  const indexOfLastCompany = currentCompanyPage * itemsPerPage;
  const indexOfFirstCompany = indexOfLastCompany - itemsPerPage;
  const currentCompanyItems = filteredCompanyOffers.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalCompanyPages = Math.ceil(filteredCompanyOffers.length / itemsPerPage);

  const totalRequests = clientRequests.length + companyOffers.length;
  const pendingRequests = [...clientRequests, ...companyOffers].filter(item => item.status === 'pending').length;
  const completedRequests = [...clientRequests, ...companyOffers].filter(item => item.status === 'completed').length;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center space-x-2 text-xl font-bold">
              <span>Sponofy Admin</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate("/")}>
              Back to Site
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container px-4 md:px-6 py-6">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage all sponsorship requests and offers</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalRequests}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Client Requests: {clientRequests.length}, Company Offers: {companyOffers.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingRequests}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting approval or rejection
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Completed Sponsorships</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{statsData?.completed_sponsorships || completedRequests}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully matched and fulfilled
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Submissions - Last 6 Months</CardTitle>
                  <CardDescription>Monthly trend of submissions</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="clientRequests" name="Client Requests" fill="#8884d8" />
                      <Bar dataKey="companyOffers" name="Company Offers" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Submissions by category/industry</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status" className="mt-1">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category / Industry</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category" className="mt-1">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Arts & Culture">Arts & Culture</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Charity">Charity</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateFilter">Time Period</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="dateFilter" className="mt-1">
                    <SelectValue placeholder="Filter by time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="sixMonths">Past 6 Months</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Submissions</CardTitle>
                <CardDescription>
                  Total: {filteredClientRequests.length + filteredCompanyOffers.length} entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="client" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="client">Client Requests ({filteredClientRequests.length})</TabsTrigger>
                    <TabsTrigger value="company">Company Offers ({filteredCompanyOffers.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="client">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : currentClientItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">#</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Age</TableHead>
                              <TableHead>Gender</TableHead>
                              <TableHead>Language</TableHead>
                              <TableHead>City</TableHead>
                              <TableHead>Project</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Platform</TableHead>
                              <TableHead>Followers</TableHead>
                              <TableHead>Social Link</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentClientItems.map((item, index) => (
                              <TableRow key={item.id}>
                                <TableCell>{indexOfFirstClient + index + 1}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.email}</TableCell>
                                <TableCell>{item.phone}</TableCell>
                                <TableCell>{item.age || "N/A"}</TableCell>
                                <TableCell className="capitalize">{item.gender || "N/A"}</TableCell>
                                <TableCell>{item.language || "N/A"}</TableCell>
                                <TableCell>{item.city || "N/A"}</TableCell>
                                <TableCell>{item.project_name}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell>${item.amount.toLocaleString()}</TableCell>
                                <TableCell>{item.social_platform || "N/A"}</TableCell>
                                <TableCell>{item.followers_count || "N/A"}</TableCell>
                                <TableCell>
                                  {item.social_link ? (
                                    <a 
                                      href={item.social_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-primary hover:underline truncate max-w-[100px] block"
                                    >
                                      Link
                                    </a>
                                  ) : (
                                    "N/A"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                    item.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    item.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                    item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status || 'pending'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Select 
                                      defaultValue={item.status || 'pending'}
                                      onValueChange={(value) => handleStatusChange(item.id, value, true)}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Set status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approve</SelectItem>
                                        <SelectItem value="rejected">Reject</SelectItem>
                                        <SelectItem value="completed">Complete</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      onClick={() => handleDelete(item.id, true)}
                                    >
                                      <Trash size={16} className="text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {totalClientPages > 1 && (
                          <div className="mt-6">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentClientPage(Math.max(1, currentClientPage - 1))}
                                    className="cursor-pointer"
                                    aria-disabled={currentClientPage === 1}
                                  />
                                </PaginationItem>
                                
                                {[...Array(totalClientPages)].map((_, i) => (
                                  <PaginationItem key={i}>
                                    <button
                                      className={`h-9 w-9 rounded-md text-sm ${
                                        currentClientPage === i + 1 
                                        ? "bg-primary text-primary-foreground" 
                                        : "text-foreground hover:bg-muted hover:text-foreground"
                                      }`}
                                      onClick={() => setCurrentClientPage(i + 1)}
                                    >
                                      {i + 1}
                                    </button>
                                  </PaginationItem>
                                ))}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => setCurrentClientPage(Math.min(totalClientPages, currentClientPage + 1))}
                                    className="cursor-pointer"
                                    aria-disabled={currentClientPage === totalClientPages}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No client requests match your filters.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="company">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : currentCompanyItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Contact Person</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Industry</TableHead>
                              <TableHead>Budget</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentCompanyItems.map((item, index) => (
                              <TableRow key={item.id}>
                                <TableCell>{indexOfFirstCompany + index + 1}</TableCell>
                                <TableCell className="font-medium">{item.company_name}</TableCell>
                                <TableCell>{item.contact_person}</TableCell>
                                <TableCell>{item.email}</TableCell>
                                <TableCell>
                                  {item.phone ? (
                                    <div className="flex items-center gap-1">
                                      <Phone size={14} />
                                      <span>{item.phone}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Not provided</span>
                                  )}
                                </TableCell>
                                <TableCell>{item.industry}</TableCell>
                                <TableCell>${item.budget.toLocaleString()}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                    item.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    item.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                    item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status || 'pending'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Select 
                                      defaultValue={item.status || 'pending'}
                                      onValueChange={(value) => handleStatusChange(item.id, value, false)}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Set status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approve</SelectItem>
                                        <SelectItem value="rejected">Reject</SelectItem>
                                        <SelectItem value="completed">Complete</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      onClick={() => handleDelete(item.id, false)}
                                    >
                                      <Trash size={16} className="text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {totalCompanyPages > 1 && (
                          <div className="mt-6">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentCompanyPage(Math.max(1, currentCompanyPage - 1))}
                                    className="cursor-pointer"
                                    aria-disabled={currentCompanyPage === 1}
                                  />
                                </PaginationItem>
                                
                                {[...Array(totalCompanyPages)].map((_, i) => (
                                  <PaginationItem key={i}>
                                    <button
                                      className={`h-9 w-9 rounded-md text-sm ${
                                        currentCompanyPage === i + 1 
                                        ? "bg-primary text-primary-foreground" 
                                        : "text-foreground hover:bg-muted hover:text-foreground"
                                      }`}
                                      onClick={() => setCurrentCompanyPage(i + 1)}
                                    >
                                      {i + 1}
                                    </button>
                                  </PaginationItem>
                                ))}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => setCurrentCompanyPage(Math.min(totalCompanyPages, currentCompanyPage + 1))}
                                    className="cursor-pointer"
                                    aria-disabled={currentCompanyPage === totalCompanyPages}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No company offers match your filters.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this request from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;

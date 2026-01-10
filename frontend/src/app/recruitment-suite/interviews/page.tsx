/**
 * RECRUITMENT & ONBOARDING SUITE — Interviews Page
 * Phase 7C.1, S5 Admin UI
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Video,
  Phone,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Interview {
  id: string;
  applicantName: string;
  jobTitle: string;
  interviewType: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  location: string | null;
  meetingLink: string | null;
  interviewers: string[];
  result: string;
  notes: string | null;
}

const DEMO_INTERVIEWS: Interview[] = [
  {
    id: '1',
    applicantName: 'Adaeze Okonkwo',
    jobTitle: 'Senior Accountant',
    interviewType: 'PHONE',
    scheduledDate: '2026-01-08',
    scheduledTime: '10:00',
    duration: 30,
    location: null,
    meetingLink: null,
    interviewers: ['Mrs. Amaka Obi'],
    result: 'PENDING',
    notes: 'Initial phone screening',
  },
  {
    id: '2',
    applicantName: 'Emeka Nwosu',
    jobTitle: 'Sales Representative',
    interviewType: 'IN_PERSON',
    scheduledDate: '2026-01-08',
    scheduledTime: '14:00',
    duration: 60,
    location: 'Head Office, Victoria Island',
    meetingLink: null,
    interviewers: ['Mr. Chidi Eze', 'Mrs. Ngozi Okafor'],
    result: 'PENDING',
    notes: 'Panel interview for sales position',
  },
  {
    id: '3',
    applicantName: 'Fatima Abdullahi',
    jobTitle: 'Software Developer',
    interviewType: 'VIDEO',
    scheduledDate: '2026-01-08',
    scheduledTime: '16:30',
    duration: 90,
    location: null,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    interviewers: ['Mr. Tunde Ajayi'],
    result: 'PENDING',
    notes: 'Technical assessment and coding challenge',
  },
  {
    id: '4',
    applicantName: 'Chukwudi Eze',
    jobTitle: 'Sales Representative',
    interviewType: 'PHONE',
    scheduledDate: '2026-01-09',
    scheduledTime: '11:00',
    duration: 30,
    location: null,
    meetingLink: null,
    interviewers: ['Mrs. Ngozi Okafor'],
    result: 'PENDING',
    notes: null,
  },
  {
    id: '5',
    applicantName: 'Ibrahim Musa',
    jobTitle: 'Software Developer',
    interviewType: 'PANEL',
    scheduledDate: '2026-01-05',
    scheduledTime: '10:00',
    duration: 90,
    location: 'Head Office, Victoria Island',
    meetingLink: null,
    interviewers: ['Mr. Tunde Ajayi', 'CTO', 'HR Manager'],
    result: 'PASS',
    notes: 'Final panel interview - recommended for offer',
  },
  {
    id: '6',
    applicantName: 'Blessing Okafor',
    jobTitle: 'Senior Accountant',
    interviewType: 'IN_PERSON',
    scheduledDate: '2025-12-28',
    scheduledTime: '14:00',
    duration: 60,
    location: 'Head Office, Victoria Island',
    meetingLink: null,
    interviewers: ['CFO', 'Mrs. Amaka Obi'],
    result: 'PASS',
    notes: 'Strong candidate - hired',
  },
];

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>(DEMO_INTERVIEWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PHONE': return <Phone className="h-4 w-4" />;
      case 'VIDEO': return <Video className="h-4 w-4" />;
      case 'IN_PERSON': return <MapPin className="h-4 w-4" />;
      case 'PANEL': return <Users className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getResultBadge = (result: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any }> = {
      PENDING: { variant: 'secondary', label: 'Pending', icon: Clock },
      PASS: { variant: 'default', label: 'Passed', icon: CheckCircle },
      FAIL: { variant: 'destructive', label: 'Failed', icon: XCircle },
      NO_SHOW: { variant: 'outline', label: 'No Show', icon: XCircle },
      RESCHEDULED: { variant: 'outline', label: 'Rescheduled', icon: RefreshCw },
    };
    const config = variants[result] || { variant: 'secondary', label: result, icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today || dateStr === '2026-01-08'; // Demo: treat Jan 8 as "today"
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = !searchQuery || 
      interview.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || interview.interviewType === typeFilter;
    const matchesResult = resultFilter === 'all' || interview.result === resultFilter;
    return matchesSearch && matchesType && matchesResult;
  });

  // Sort: today first, then by date/time
  const sortedInterviews = [...filteredInterviews].sort((a, b) => {
    if (isToday(a.scheduledDate) && !isToday(b.scheduledDate)) return -1;
    if (!isToday(a.scheduledDate) && isToday(b.scheduledDate)) return 1;
    const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
    if (dateCompare !== 0) return dateCompare;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  const todayInterviews = interviews.filter((i: any) => isToday(i.scheduledDate) && i.result === 'PENDING');

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="interviews-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/recruitment-suite">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-600" />
              Interviews
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Schedule and manage candidate interviews
            </p>
          </div>
        </div>
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Button data-testid="schedule-interview-btn">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
              <DialogDescription>
                Set up an interview with a candidate
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Select Applicant *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an applicant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Adaeze Okonkwo - Senior Accountant</SelectItem>
                    <SelectItem value="2">Emeka Nwosu - Sales Representative</SelectItem>
                    <SelectItem value="3">Fatima Abdullahi - Software Developer</SelectItem>
                    <SelectItem value="4">Chukwudi Eze - Sales Representative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Interview Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHONE">Phone Screen</SelectItem>
                      <SelectItem value="VIDEO">Video Call</SelectItem>
                      <SelectItem value="IN_PERSON">In-Person</SelectItem>
                      <SelectItem value="PANEL">Panel Interview</SelectItem>
                      <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select defaultValue="60">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Interviewer(s)</Label>
                <Input placeholder="e.g., Mrs. Amaka Obi, Mr. Chidi Eze" />
              </div>
              <div className="space-y-2">
                <Label>Location / Meeting Link</Label>
                <Input placeholder="e.g., Head Office or https://meet.google.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Any preparation notes or instructions..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowScheduleDialog(false)}>
                Schedule Interview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Summary */}
      {todayInterviews.length > 0 && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Today&apos;s Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {todayInterviews.map(interview => (
                <Badge key={interview.id} variant="secondary" className="py-2 px-3">
                  <span className="font-medium">{interview.scheduledTime}</span>
                  <span className="mx-2">•</span>
                  {interview.applicantName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by applicant name or job..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-interviews"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PHONE">Phone</SelectItem>
                <SelectItem value="VIDEO">Video</SelectItem>
                <SelectItem value="IN_PERSON">In-Person</SelectItem>
                <SelectItem value="PANEL">Panel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-result">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PASS">Passed</SelectItem>
                <SelectItem value="FAIL">Failed</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Interviews List */}
      <div className="space-y-3">
        {sortedInterviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No interviews found matching your criteria
            </CardContent>
          </Card>
        ) : (
          sortedInterviews.map((interview) => (
            <Card 
              key={interview.id} 
              className={`hover:shadow-md transition-shadow ${isToday(interview.scheduledDate) ? 'border-purple-300' : ''}`}
              data-testid={`interview-card-${interview.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      interview.interviewType === 'PHONE' ? 'bg-blue-100 text-blue-600' :
                      interview.interviewType === 'VIDEO' ? 'bg-purple-100 text-purple-600' :
                      interview.interviewType === 'IN_PERSON' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {getTypeIcon(interview.interviewType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{interview.applicantName}</h3>
                        {getResultBadge(interview.result)}
                        {isToday(interview.scheduledDate) && interview.result === 'PENDING' && (
                          <Badge variant="outline" className="text-purple-600 border-purple-300">Today</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{interview.jobTitle}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(interview.scheduledDate).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {interview.scheduledTime} ({interview.duration} min)
                        </span>
                        <span className="capitalize">{interview.interviewType.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <div className="text-gray-600">
                        {interview.interviewers.join(', ')}
                      </div>
                      {interview.location && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                          <MapPin className="h-3 w-3" />
                          {interview.location}
                        </div>
                      )}
                      {interview.meetingLink && (
                        <a 
                          href={interview.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Join Meeting
                        </a>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {interview.result === 'PENDING' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Passed
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <XCircle className="mr-2 h-4 w-4" />
                              Mark as Failed
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Reschedule
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Showing {sortedInterviews.length} of {interviews.length} interviews</span>
            <div className="flex gap-4">
              <span>{interviews.filter((i: any) => i.result === 'PENDING').length} Pending</span>
              <span>{interviews.filter((i: any) => i.result === 'PASS').length} Passed</span>
              <span>{interviews.filter((i: any) => i.result === 'FAIL').length} Failed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

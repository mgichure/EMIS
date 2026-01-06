import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ColumnDef, 
  ColumnFiltersState, 
  SortingState, 
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableHead, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db, AdmissionApplication, Intake, Program } from '@/lib/database';
import { formatDistanceToNow } from 'date-fns';
import { DecisionDialog } from './DecisionDialog';
import { SyncQueueDrawer } from './SyncQueueDrawer';
import { AdmissionFilters } from './AdmissionFilters';

interface AdmissionsListProps {
  onViewApplication: (application: AdmissionApplication) => void;
  onEditApplication: (application: AdmissionApplication) => void;
  onCreateNew: () => void;
  filters?: {
    search: string;
    status: string;
    intakeId: string;
    programId: string;
    dateFrom: string;
    dateTo: string;
  };
}

export const AdmissionsList = ({ 
  onViewApplication, 
  onEditApplication, 
  onCreateNew,
  filters 
}: AdmissionsListProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedApplication, setSelectedApplication] = useState<AdmissionApplication | null>(null);
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(filters?.status || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(filters?.search || '');

  const applications = useLiveQuery(() => db.applications.toArray());
  const intakes = useLiveQuery(() => db.intakes.toArray());
  const programs = useLiveQuery(() => db.programs.toArray());

  // Apply filters to applications
  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    return applications.filter(app => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const fullName = `${app.personalInfo.firstName} ${app.personalInfo.lastName}`.toLowerCase();
        const email = app.personalInfo.email.toLowerCase();
        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter && statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // Intake filter
      if (filters?.intakeId && app.intakeId !== filters.intakeId) {
        return false;
      }

      // Program filter
      if (filters?.programId && app.programId !== filters.programId) {
        return false;
      }

      // Date range filter
      if (filters?.dateFrom || filters?.dateTo) {
        const appDate = new Date(app.createdAt);
        if (filters.dateFrom && appDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && appDate > new Date(filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [applications, filters, statusFilter, searchQuery]);

  const columns: ColumnDef<AdmissionApplication>[] = [
    {
      accessorKey: 'personalInfo',
      header: 'Applicant',
      cell: ({ row }) => {
        const personalInfo = row.getValue('personalInfo') as { firstName: string; lastName: string; email: string };
        return (
          <div>
            <div className="font-medium">
              {personalInfo.firstName} {personalInfo.lastName}
            </div>
            <div className="text-sm text-gray-500">{personalInfo.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'academicInfo',
      header: 'Academic Info',
      cell: ({ row }) => {
        const academicInfo = row.getValue('academicInfo') as { previousSchool: string; gradeLevel: string };
        return (
          <div>
            <div className="font-medium">{academicInfo.previousSchool}</div>
            <div className="text-sm text-gray-500">Grade {academicInfo.gradeLevel}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'intakeId',
      header: 'Intake',
      cell: ({ row }) => {
        const intakeId = row.getValue('intakeId') as string;
        const intake = intakes?.find(i => i.id === intakeId);
        return (
          <div>
            <div className="font-medium">{intake?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{intake?.academicYear || ''}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'programId',
      header: 'Program',
      cell: ({ row }) => {
        const programId = row.getValue('programId') as string;
        const program = programs?.find(p => p.id === programId);
        return (
          <div>
            <div className="font-medium">{program?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{program?.code || ''}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'draft':
              return <Badge variant="secondary">Draft</Badge>;
            case 'submitted':
              return <Badge variant="default">Submitted</Badge>;
            case 'under_review':
              return <Badge variant="outline">Under Review</Badge>;
            case 'accepted':
              return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
            case 'rejected':
              return <Badge variant="destructive">Rejected</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: 'documents',
      header: 'Documents',
      cell: ({ row }) => {
        const documents = row.getValue('documents') as string[];
        return (
          <div className="text-center">
            <Badge variant="outline">{documents.length}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Submitted',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return (
          <div className="text-sm text-gray-500">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        );
      },
    },
    {
      accessorKey: 'synced',
      header: 'Sync Status',
      cell: ({ row }) => {
        const synced = row.getValue('synced') as boolean;
        return (
          <div className="flex items-center gap-2">
            {synced ? (
              <Badge className="bg-green-100 text-green-800">Synced</Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const application = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem onClick={() => onViewApplication(application)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuCheckboxItem>
              {application.status === 'draft' && (
                <DropdownMenuCheckboxItem onClick={() => onEditApplication(application)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuCheckboxItem>
              )}
              {application.status === 'submitted' && (
                <DropdownMenuCheckboxItem onClick={() => {
                  setSelectedApplication(application);
                  setIsDecisionDialogOpen(true);
                }}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Review Decision
                </DropdownMenuCheckboxItem>
              )}
              <DropdownMenuCheckboxItem onClick={() => {
                // Export application data
                const dataStr = JSON.stringify(application, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `application-${application.id}.json`;
                link.click();
              }}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];



  const table = useReactTable({
    data: filteredApplications ?? [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDecision = async (decision: 'accepted' | 'rejected', _notes: string) => {
    if (!selectedApplication) return;
    
    try {
      // Update application status
      await db.applications.update(selectedApplication.id!, {
        status: decision,
        updatedAt: new Date(),
      });
      
      // Add to sync queue
      await db.syncQueue.add({
        type: 'application',
        action: 'update',
        data: { ...selectedApplication, status: decision },
        retryCount: 0,
        lastAttempt: new Date(),
        createdAt: new Date(),
      });
      
      setIsDecisionDialogOpen(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Failed to update application:', error);
      alert('Failed to update application. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Admissions</CardTitle>
            <CardDescription>
              Manage student admission applications
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <SyncQueueDrawer />
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            placeholder="Search applicants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No applications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Decision Dialog */}
      <DecisionDialog
        application={selectedApplication}
        isOpen={isDecisionDialogOpen}
        onClose={() => {
          setIsDecisionDialogOpen(false);
          setSelectedApplication(null);
        }}
        onDecision={handleDecision}
      />
    </Card>
  );
};

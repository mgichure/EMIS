# Admissions & Enrolment Module

A comprehensive offline-capable module for managing student admission applications and enrolment processes in the Education Management Information System (EMIS).

## Features

### 🎯 Core Functionality
- **Multi-step Application Wizard**: Guided application process with validation
- **Document Management**: Upload, preview, and manage PDF/JPG/PNG documents
- **Offline Support**: Work without internet connection with automatic sync
- **Real-time Sync**: Automatic synchronization when connection is restored
- **Status Tracking**: Monitor application progress from draft to decision

### 📱 Offline Capabilities
- **Local Storage**: Applications stored in IndexedDB using Dexie
- **Sync Queue**: Automatic queuing of offline changes
- **Conflict Resolution**: Smart handling of data conflicts
- **Retry Mechanism**: Automatic retry with exponential backoff

### 🔍 Data Management
- **Advanced Filtering**: Filter by status, date, and search queries
- **Sorting & Pagination**: Efficient data handling for large datasets
- **Export Functionality**: Download application data as JSON
- **Real-time Updates**: Live data updates using Dexie React Hooks

## Components

### 1. AdmissionsList
- **DataTable**: Comprehensive table with filters and actions
- **Status Management**: View and update application statuses
- **Search & Filter**: Find applications quickly
- **Bulk Actions**: Export and manage multiple applications

### 2. AdmissionWizard
- **Step 1**: Personal Information (name, contact, address, demographics)
- **Step 2**: Academic Information (school, grade, GPA, achievements)
- **Step 3**: Document Upload (PDF, JPG, PNG with preview)
- **Step 4**: Review & Submit (comprehensive review before submission)

### 3. DecisionDialog
- **Application Review**: Complete application summary
- **Decision Making**: Accept or reject with notes
- **Status Updates**: Automatic status changes
- **Audit Trail**: Track decision history

### 4. OfflineBanner
- **Connection Status**: Real-time online/offline detection
- **Sync Status**: Show pending sync items
- **Manual Sync**: Trigger sync manually when needed

### 5. SyncQueueDrawer
- **Queue Management**: View all pending sync items
- **Retry Logic**: Manual retry for failed items
- **Progress Tracking**: Monitor sync progress
- **Error Handling**: Clear failed items and resolve conflicts

## Technical Architecture

### Database Schema
```typescript
interface AdmissionApplication {
  id?: string;
  personalInfo: PersonalInfo;
  academicInfo: AcademicInfo;
  documents: string[];
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
  syncId?: string;
}

interface AdmissionDocument {
  id?: string;
  applicationId: string;
  name: string;
  type: 'pdf' | 'jpg' | 'png';
  size: number;
  data: Blob;
  uploadedAt: Date;
  synced: boolean;
}

interface SyncQueueItem {
  id?: string;
  type: 'application' | 'document';
  action: 'create' | 'update' | 'delete';
  data: any;
  retryCount: number;
  lastAttempt: Date;
  createdAt: Date;
}
```

### Offline Strategy
1. **Local First**: All data stored locally in IndexedDB
2. **Queue Based**: Changes queued for sync when offline
3. **Automatic Retry**: Failed syncs retried automatically
4. **Conflict Resolution**: Smart merging of conflicting data

### Sync Process
1. **Detection**: Monitor online/offline status
2. **Queue Processing**: Process pending sync items
3. **API Calls**: Send data to backend endpoints
4. **Status Update**: Mark items as synced
5. **Error Handling**: Retry failed items with backoff

## Usage

### Starting the Application
```bash
cd frontend
npm install
npm run dev
```

### Navigation
- **Home**: Overview and module selection
- **Admissions**: Main admissions module
- **Students**: Student management (future)
- **Courses**: Course management (future)

### Creating an Application
1. Navigate to `/admissions`
2. Click "New Application"
3. Complete the 4-step wizard:
   - Personal Information
   - Academic Information
   - Document Upload
   - Review & Submit
4. Application saved locally and queued for sync

### Managing Applications
1. View all applications in the data table
2. Filter by status, search by name/email
3. View detailed application information
4. Make decisions (accept/reject) for submitted applications
5. Export application data as needed

### Offline Workflow
1. **Work Offline**: Create and edit applications without internet
2. **Data Persistence**: All changes saved locally
3. **Automatic Sync**: Changes sync when connection restored
4. **Monitor Progress**: Track sync status in real-time

## API Endpoints

The module expects the following backend endpoints:

```
POST   /api/admissions/applications    - Create application
PUT    /api/admissions/applications    - Update application
DELETE /api/admissions/applications    - Delete application
POST   /api/admissions/documents      - Upload document
PUT    /api/admissions/documents      - Update document
DELETE /api/admissions/documents      - Delete document
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_OFFLINE_ENABLED=true
NEXT_PUBLIC_SYNC_INTERVAL=30000
```

### Database Configuration
```typescript
// lib/database.ts
export class AdmissionsDatabase extends Dexie {
  constructor() {
    super('AdmissionsDatabase');
    this.version(1).stores({
      applications: '++id, status, synced, createdAt',
      documents: '++id, applicationId, synced, uploadedAt',
      syncQueue: '++id, type, action, createdAt'
    });
  }
}
```

## Dependencies

### Core Dependencies
- **Next.js 15**: React framework
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling

### Database & Offline
- **Dexie**: IndexedDB wrapper
- **dexie-react-hooks**: React hooks for Dexie

### UI Components
- **Radix UI**: Accessible component primitives
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Lucide React**: Icons

### Data Management
- **TanStack Table**: Data table functionality
- **date-fns**: Date utilities

## Browser Support

- **Chrome**: 88+
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

## Performance Considerations

- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: Efficient rendering of large datasets
- **Debounced Search**: Optimized search performance
- **IndexedDB**: Fast local data access

## Security Features

- **Input Validation**: Comprehensive form validation
- **File Type Restrictions**: Limited to PDF, JPG, PNG
- **File Size Limits**: Maximum 10MB per file
- **Data Sanitization**: Clean input data before storage

## Future Enhancements

- **Bulk Operations**: Process multiple applications
- **Advanced Analytics**: Detailed reporting and insights
- **Workflow Automation**: Custom approval workflows
- **Integration APIs**: Connect with external systems
- **Mobile App**: Native mobile application
- **Multi-language**: Internationalization support

## Troubleshooting

### Common Issues

1. **Sync Failures**
   - Check internet connection
   - Verify API endpoints
   - Review browser console for errors

2. **Offline Mode Not Working**
   - Ensure IndexedDB is enabled
   - Check browser storage permissions
   - Verify Dexie installation

3. **File Upload Issues**
   - Check file size limits
   - Verify supported file types
   - Ensure sufficient storage space

### Debug Mode
Enable debug logging by setting:
```typescript
localStorage.setItem('debug', 'true');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

export type ProjectStatus = 'ACTIVE' | 'TRIAL' | 'PENDING';

export interface Project {
    id: number;
    name: string;
    location: string;
    address: string;
    expected: string;
    endDate: string;
    duration: string;
    status: ProjectStatus;
}

export const initialProjects: Project[] = [
    {
        id: 1,
        name: 'Head Office Renovation',
        location: 'New York, NY',
        address: '123 Main St, New York, NY 10001',
        expected: '01/04/2026',
        endDate: '30/09/2026',
        duration: '6 months',
        status: 'ACTIVE',
    },
    {
        id: 2,
        name: 'Retail Expansion Phase II',
        location: 'Chicago, IL',
        address: '200 Lake Shore Dr, Chicago, IL 60601',
        expected: '15/05/2026',
        endDate: '15/12/2026',
        duration: '7 months',
        status: 'TRIAL',
    },
    {
        id: 3,
        name: 'Logistics Hub Upgrade',
        location: 'Dallas, TX',
        address: '890 Industrial Rd, Dallas, TX 75201',
        expected: '01/03/2026',
        endDate: '31/08/2026',
        duration: '6 months',
        status: 'PENDING',
    },
    {
        id: 4,
        name: 'Data Center Migration',
        location: 'Seattle, WA',
        address: '410 Cloud Ave, Seattle, WA 98101',
        expected: '10/04/2026',
        endDate: '10/10/2026',
        duration: '6 months',
        status: 'ACTIVE',
    },
];

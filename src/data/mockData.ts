// ============================================================
// Construction OS — Central Mock Data
// All data is consistent across screens:
// Clients → Projects → BOQ → Procurement → Inventory → Finance → Risks → Client Portal
// ============================================================

export type Status = 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'pending' | 'active' | 'overdue';

// ── Clients ──────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  activeProjects: number;
  accountBalance: number;
  status: 'Active' | 'Inactive' | 'Prospect';
  since: string;
}

export const clients: Client[] = [
  { id: 'C001', name: 'James Mukamuri', company: 'Mukamuri Holdings', email: 'james@mukamuri.co.zw', phone: '+263 77 234 5678', activeProjects: 2, accountBalance: 145000, status: 'Active', since: 'Jan 2024' },
  { id: 'C002', name: 'Sarah Chigumba', company: 'Chigumba Properties', email: 'sarah@chigprops.co.zw', phone: '+263 71 882 1100', activeProjects: 1, accountBalance: 0, status: 'Active', since: 'Mar 2024' },
  { id: 'C003', name: 'Tendai Nyathi', company: 'Nyathi Investments', email: 'tendai@nyathiinv.co.zw', phone: '+263 78 551 2233', activeProjects: 1, accountBalance: -32000, status: 'Active', since: 'Feb 2024' },
  { id: 'C004', name: 'Robert Marufu', company: 'Marufu Group', email: 'robert@marufu.co.zw', phone: '+263 77 445 6677', activeProjects: 1, accountBalance: 78000, status: 'Active', since: 'Jun 2024' },
  { id: 'C005', name: 'Patricia Sibanda', company: 'Sibanda Estates', email: 'patricia@sibanda.co.zw', phone: '+263 71 339 8821', activeProjects: 0, accountBalance: 0, status: 'Prospect', since: 'Aug 2024' },
];

// ── Enquiries ────────────────────────────────────────────────
export type EnquiryStage = 'New' | 'Contacted' | 'Qualified' | 'Quoted' | 'Won' | 'Lost';

export interface Enquiry {
  id: string;
  client: string;
  company: string;
  project: string;
  value: number;
  stage: EnquiryStage;
  date: string;
  source: string;
  phone: string;
  email: string;
}

export const enquiries: Enquiry[] = [
  { id: 'E001', client: 'Patricia Sibanda', company: 'Sibanda Estates', project: 'Highfield Apartments Complex', value: 850000, stage: 'New', date: '2026-09-08', source: 'Website', phone: '+263 71 339 8821', email: 'patricia@sibanda.co.zw' },
  { id: 'E002', client: 'Michael Tanaka', company: 'Tanaka Builders', project: 'Belvedere Office Park', value: 1200000, stage: 'Contacted', date: '2026-09-05', source: 'Referral', phone: '+263 77 112 4455', email: 'mike@tanaka.co.zw' },
  { id: 'E003', client: 'Grace Zhou', company: 'Zhou Development Trust', project: 'Greendale Shopping Mall', value: 2100000, stage: 'Qualified', date: '2026-08-28', source: 'LinkedIn', phone: '+263 78 220 7788', email: 'grace@zhoutrust.co.zw' },
  { id: 'E004', client: 'Farai Dube', company: 'Dube Construction Ltd', project: 'Mount Pleasant School Extension', value: 640000, stage: 'Quoted', date: '2026-08-20', source: 'Walk-in', phone: '+263 71 556 9911', email: 'farai@dubecon.co.zw' },
  { id: 'E005', client: 'James Mukamuri', company: 'Mukamuri Holdings', project: 'Riverside Office Development', value: 1800000, stage: 'Won', date: '2026-07-15', source: 'Referral', phone: '+263 77 234 5678', email: 'james@mukamuri.co.zw' },
  { id: 'E006', client: 'Brian Mhaka', company: 'Mhaka Properties', project: 'Chitungwiza Duplex Units', value: 520000, stage: 'Lost', date: '2026-07-02', source: 'Website', phone: '+263 78 665 4433', email: 'brian@mhaka.co.zw' },
  { id: 'E007', client: 'Sarah Chigumba', company: 'Chigumba Properties', project: 'Borrowdale Villa Project', value: 950000, stage: 'Won', date: '2026-06-18', source: 'Referral', phone: '+263 71 882 1100', email: 'sarah@chigprops.co.zw' },
  { id: 'E008', client: 'Robert Marufu', company: 'Marufu Group', project: 'Westgate Retail Renovation', value: 720000, stage: 'Won', date: '2026-05-22', source: 'Direct', phone: '+263 77 445 6677', email: 'robert@marufu.co.zw' },
];

// ── Projects ─────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  client: string;
  clientCompany: string;
  manager: string;
  progress: number;
  budget: number;
  actualCost: number;
  deadline: string;
  startDate: string;
  health: 'on-track' | 'at-risk' | 'delayed' | 'completed';
  status: 'Active' | 'Planning' | 'Completed';
  location: string;
  description: string;
  contractValue: number;
}

export const projects: Project[] = [
  {
    id: 'P001',
    name: 'Riverside Office Development',
    client: 'James Mukamuri',
    clientCompany: 'Mukamuri Holdings',
    manager: 'Tafadzwa Moyo',
    progress: 68,
    budget: 1620000,
    actualCost: 1104000,
    deadline: '2026-12-15',
    startDate: '2026-03-01',
    health: 'on-track',
    status: 'Active',
    location: 'Riverside, Harare',
    description: 'A 3-storey commercial office development with underground parking, modern glass facade, and landscaped surroundings.',
    contractValue: 1800000,
  },
  {
    id: 'P002',
    name: 'Harare Residential Complex',
    client: 'Tendai Nyathi',
    clientCompany: 'Nyathi Investments',
    manager: 'Kudzai Chirwa',
    progress: 42,
    budget: 1450000,
    actualCost: 980000,
    deadline: '2027-02-28',
    startDate: '2026-04-15',
    health: 'at-risk',
    status: 'Active',
    location: 'Borrowdale, Harare',
    description: 'A 24-unit residential complex with shared amenities, swimming pool, and secure perimeter wall.',
    contractValue: 1650000,
  },
  {
    id: 'P003',
    name: 'Westgate Retail Renovation',
    client: 'Robert Marufu',
    clientCompany: 'Marufu Group',
    manager: 'Nomsa Dube',
    progress: 85,
    budget: 680000,
    actualCost: 612000,
    deadline: '2026-10-30',
    startDate: '2026-01-10',
    health: 'on-track',
    status: 'Active',
    location: 'Westgate, Harare',
    description: 'Complete renovation of an existing retail space including new flooring, lighting, HVAC, and storefront redesign.',
    contractValue: 720000,
  },
  {
    id: 'P004',
    name: 'Borrowdale Villa Project',
    client: 'Sarah Chigumba',
    clientCompany: 'Chigumba Properties',
    manager: 'Tafadzwa Moyo',
    progress: 55,
    budget: 820000,
    actualCost: 533000,
    deadline: '2026-11-20',
    startDate: '2026-02-20',
    health: 'delayed',
    status: 'Active',
    location: 'Borrowdale, Harare',
    description: 'A luxury 5-bedroom villa with swimming pool, double garage, and modern architectural finishes.',
    contractValue: 950000,
  },
];

// ── Tasks ────────────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Review' | 'Done' | 'Overdue';
}

export const tasks: Task[] = [
  { id: 'T001', title: 'Pour concrete foundation — Section B', project: 'Riverside Office Development', assignee: 'Tafadzwa Moyo', dueDate: '2026-09-14', priority: 'High', status: 'In Progress' },
  { id: 'T002', title: 'Order steel reinforcement bars', project: 'Harare Residential Complex', assignee: 'Kudzai Chirwa', dueDate: '2026-09-12', priority: 'High', status: 'Overdue' },
  { id: 'T003', title: 'Final electrical inspection', project: 'Westgate Retail Renovation', assignee: 'Nomsa Dube', dueDate: '2026-09-18', priority: 'Medium', status: 'To Do' },
  { id: 'T004', title: 'Swimming pool tiling', project: 'Borrowdale Villa Project', assignee: 'Tafadzwa Moyo', dueDate: '2026-09-25', priority: 'Medium', status: 'To Do' },
  { id: 'T005', title: 'Submit BOQ revision to client', project: 'Riverside Office Development', assignee: 'Kudzai Chirwa', dueDate: '2026-09-15', priority: 'High', status: 'Review' },
  { id: 'T006', title: 'Install HVAC ducting — Level 2', project: 'Riverside Office Development', assignee: 'Nomsa Dube', dueDate: '2026-09-20', priority: 'Medium', status: 'To Do' },
  { id: 'T007', title: 'Roof truss installation', project: 'Harare Residential Complex', assignee: 'Kudzai Chirwa', dueDate: '2026-09-30', priority: 'High', status: 'To Do' },
  { id: 'T008', title: 'Client walkthrough — Ground floor', project: 'Westgate Retail Renovation', assignee: 'Nomsa Dube', dueDate: '2026-09-10', priority: 'Low', status: 'Done' },
  { id: 'T009', title: 'Landscaping plan approval', project: 'Riverside Office Development', assignee: 'Tafadzwa Moyo', dueDate: '2026-09-28', priority: 'Low', status: 'To Do' },
  { id: 'T010', title: 'Plastering — Block C', project: 'Harare Residential Complex', assignee: 'Kudzai Chirwa', dueDate: '2026-09-08', priority: 'Medium', status: 'Overdue' },
];

// ── Calendar Events ──────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'project-meeting' | 'site-meeting' | 'inspection' | 'deadline' | 'client-meeting';
  project: string;
}

export const calendarEvents: CalendarEvent[] = [
  { id: 'EV01', title: 'Weekly site briefing', date: '2026-09-11', time: '07:00', type: 'site-meeting', project: 'Riverside Office Development' },
  { id: 'EV02', title: 'Client progress review', date: '2026-09-12', time: '10:00', type: 'client-meeting', project: 'Borrowdale Villa Project' },
  { id: 'EV03', title: 'Structural inspection', date: '2026-09-14', time: '09:00', type: 'inspection', project: 'Riverside Office Development' },
  { id: 'EV04', title: 'Steel delivery deadline', date: '2026-09-15', time: '12:00', type: 'deadline', project: 'Harare Residential Complex' },
  { id: 'EV05', title: 'Project coordination meeting', date: '2026-09-16', time: '14:00', type: 'project-meeting', project: 'Westgate Retail Renovation' },
  { id: 'EV06', title: 'BOQ revision submission', date: '2026-09-18', time: '15:00', type: 'deadline', project: 'Riverside Office Development' },
  { id: 'EV07', title: 'Client walkthrough — Final', date: '2026-09-20', time: '11:00', type: 'client-meeting', project: 'Westgate Retail Renovation' },
  { id: 'EV08', title: 'Electrical safety inspection', date: '2026-09-22', time: '08:00', type: 'inspection', project: 'Westgate Retail Renovation' },
  { id: 'EV09', title: 'Monthly progress meeting', date: '2026-09-25', time: '09:00', type: 'project-meeting', project: 'Harare Residential Complex' },
  { id: 'EV10', title: 'Pool installation deadline', date: '2026-09-28', time: '16:00', type: 'deadline', project: 'Borrowdale Villa Project' },
  { id: 'EV11', title: 'Client handover meeting', date: '2026-10-30', time: '10:00', type: 'client-meeting', project: 'Westgate Retail Renovation' },
];

// ── BOQ ──────────────────────────────────────────────────────
export interface BOQItem {
  id: string;
  item: string;
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
  category: 'Materials' | 'Labour' | 'Equipment' | 'Subcontractors';
  project: string;
}

export const boqItems: BOQItem[] = [
  { id: 'B001', item: 'OPC Cement 42.5N', description: 'Portland cement 50kg bags', qty: 1200, unit: 'bags', unitCost: 14.5, category: 'Materials', project: 'Riverside Office Development' },
  { id: 'B002', item: 'Reinforcement Steel Y12', description: 'High-tensile deformed bar 12mm', qty: 8, unit: 'tonnes', unitCost: 1250, category: 'Materials', project: 'Riverside Office Development' },
  { id: 'B003', item: 'Common Bricks', description: 'Solid red bricks 220x105x70mm', qty: 45000, unit: 'pcs', unitCost: 0.35, category: 'Materials', project: 'Riverside Office Development' },
  { id: 'B004', item: 'Ready-Mix Concrete 25MPa', description: 'Ready-mix concrete for foundations', qty: 180, unit: 'm³', unitCost: 165, category: 'Materials', project: 'Riverside Office Development' },
  { id: 'B005', item: 'Masonry Labour', description: 'Bricklaying and plastering', qty: 1, unit: 'lumpsum', unitCost: 85000, category: 'Labour', project: 'Riverside Office Development' },
  { id: 'B006', item: 'Electrical Installation', description: '1st & 2nd fix electrical work', qty: 1, unit: 'lumpsum', unitCost: 62000, category: 'Subcontractors', project: 'Riverside Office Development' },
  { id: 'B007', item: 'Plumbing Installation', description: 'Full plumbing and drainage', qty: 1, unit: 'lumpsum', unitCost: 48000, category: 'Subcontractors', project: 'Riverside Office Development' },
  { id: 'B008', item: 'Crane Rental', description: 'Mobile crane 25-tonne, 30 days', qty: 30, unit: 'days', unitCost: 450, category: 'Equipment', project: 'Riverside Office Development' },
  { id: 'B009', item: 'Excavator Rental', description: 'CAT 320 excavator, 15 days', qty: 15, unit: 'days', unitCost: 380, category: 'Equipment', project: 'Riverside Office Development' },
  { id: 'B010', item: 'Aluminium Windows', description: 'Sliding aluminium windows', qty: 48, unit: 'pcs', unitCost: 320, category: 'Materials', project: 'Riverside Office Development' },
  { id: 'B011', item: 'Paint — Interior', description: 'Premium acrylic emulsion 20L', qty: 65, unit: 'drums', unitCost: 95, category: 'Materials', project: 'Riverside Office Development' },
  { id: 'B012', item: 'Paint — Exterior', description: 'Weatherproof exterior paint 20L', qty: 40, unit: 'drums', unitCost: 120, category: 'Materials', project: 'Riverside Office Development' },
  { id: 'B013', item: 'Roofing Sheets', description: 'IBR chromadek roofing sheets', qty: 850, unit: 'm²', unitCost: 18.5, category: 'Materials', project: 'Riverside Office Development' },
  { id: 'B014', item: 'Carpentry Labour', description: 'Door & window frame installation', qty: 1, unit: 'lumpsum', unitCost: 35000, category: 'Labour', project: 'Riverside Office Development' },
];

// ── Procurement ──────────────────────────────────────────────
export interface PurchaseRequest {
  id: string;
  item: string;
  project: string;
  qty: number;
  unit: string;
  estCost: number;
  requestedBy: string;
  date: string;
  status: 'Requested' | 'Approved' | 'PO Issued' | 'Delivered' | 'Rejected';
  supplier: string;
}

export const purchaseRequests: PurchaseRequest[] = [
  { id: 'PR001', item: 'OPC Cement 42.5N (500 bags)', project: 'Riverside Office Development', qty: 500, unit: 'bags', estCost: 7250, requestedBy: 'Tafadzwa Moyo', date: '2026-09-08', status: 'Approved', supplier: 'Pioneer Cement Distributors' },
  { id: 'PR002', item: 'Reinforcement Steel Y12 (4 tonnes)', project: 'Harare Residential Complex', qty: 4, unit: 'tonnes', estCost: 5000, requestedBy: 'Kudzai Chirwa', date: '2026-09-06', status: 'PO Issued', supplier: 'Steelmasters Zimbabwe' },
  { id: 'PR003', item: 'Aluminium Window Frames (24 pcs)', project: 'Borrowdale Villa Project', qty: 24, unit: 'pcs', estCost: 7680, requestedBy: 'Tafadzwa Moyo', date: '2026-09-05', status: 'Delivered', supplier: 'Aluminium Works Ltd' },
  { id: 'PR004', item: 'Ready-Mix Concrete 25MPa (60 m³)', project: 'Riverside Office Development', qty: 60, unit: 'm³', estCost: 9900, requestedBy: 'Tafadzwa Moyo', date: '2026-09-09', status: 'Requested', supplier: 'Lafarge Concrete' },
  { id: 'PR005', item: 'IBR Roofing Sheets (850 m²)', project: 'Riverside Office Development', qty: 850, unit: 'm²', estCost: 15725, requestedBy: 'Nomsa Dube', date: '2026-09-03', status: 'Approved', supplier: 'MacSteel Roofing' },
  { id: 'PR006', item: 'Electrical Cabling & Conduits', project: 'Westgate Retail Renovation', qty: 1, unit: 'lot', estCost: 12500, requestedBy: 'Nomsa Dube', date: '2026-09-01', status: 'Delivered', supplier: 'Electrical Solutions ZW' },
  { id: 'PR007', item: 'Paint — Exterior (40 drums)', project: 'Borrowdale Villa Project', qty: 40, unit: 'drums', estCost: 4800, requestedBy: 'Tafadzwa Moyo', date: '2026-09-07', status: 'Requested', supplier: 'Dulux Paint Centre' },
];

// ── Suppliers ────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  email: string;
  rating: number;
  totalOrders: number;
  outstandingBalance: number;
  status: 'Active' | 'Inactive';
}

export const suppliers: Supplier[] = [
  { id: 'S001', name: 'Pioneer Cement Distributors', category: 'Cement & Concrete', contact: 'John Banda', phone: '+263 77 100 2001', email: 'sales@pioneer.co.zw', rating: 4.5, totalOrders: 42, outstandingBalance: 7250, status: 'Active' },
  { id: 'S002', name: 'Steelmasters Zimbabwe', category: 'Steel & Reinforcement', contact: 'Mary Sibanda', phone: '+263 71 200 3002', email: 'info@steelmasters.co.zw', rating: 4.2, totalOrders: 28, outstandingBalance: 5000, status: 'Active' },
  { id: 'S003', name: 'Aluminium Works Ltd', category: 'Windows & Doors', contact: 'Peter Chauke', phone: '+263 78 300 4003', email: 'sales@alworks.co.zw', rating: 4.7, totalOrders: 15, outstandingBalance: 0, status: 'Active' },
  { id: 'S004', name: 'Lafarge Concrete', category: 'Ready-Mix Concrete', contact: 'Susan Ncube', phone: '+263 77 400 5004', email: 'orders@lafarge.co.zw', rating: 4.3, totalOrders: 35, outstandingBalance: 9900, status: 'Active' },
  { id: 'S005', name: 'MacSteel Roofing', category: 'Roofing Materials', contact: 'David Gumbo', phone: '+263 71 500 6005', email: 'info@macsteel.co.zw', rating: 4.0, totalOrders: 18, outstandingBalance: 15725, status: 'Active' },
  { id: 'S006', name: 'Dulux Paint Centre', category: 'Paint & Finishes', contact: 'Ruth Madziva', phone: '+263 78 600 7006', email: 'sales@duluxcentre.co.zw', rating: 4.6, totalOrders: 22, outstandingBalance: 4800, status: 'Active' },
  { id: 'S007', name: 'Electrical Solutions ZW', category: 'Electrical Supplies', contact: 'Alex Zhou', phone: '+263 77 700 8007', email: 'info@elecsol.co.zw', rating: 4.4, totalOrders: 12, outstandingBalance: 0, status: 'Active' },
  { id: 'S008', name: 'Timber World Harare', category: 'Timber & Wood', contact: 'Brian Chiweshe', phone: '+263 71 800 9008', email: 'sales@timberworld.co.zw', rating: 3.9, totalOrders: 8, outstandingBalance: 0, status: 'Inactive' },
];

// ── Inventory ────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  material: string;
  category: string;
  stock: number;
  allocated: number;
  reorderLevel: number;
  unit: string;
  unitCost: number;
}

export const inventory: InventoryItem[] = [
  { id: 'INV001', material: 'OPC Cement 42.5N', category: 'Cement', stock: 340, allocated: 120, reorderLevel: 200, unit: 'bags', unitCost: 14.5 },
  { id: 'INV002', material: 'Reinforcement Steel Y12', category: 'Steel', stock: 2.5, allocated: 1.5, reorderLevel: 5, unit: 'tonnes', unitCost: 1250 },
  { id: 'INV003', material: 'Common Bricks', category: 'Bricks', stock: 28000, allocated: 8000, reorderLevel: 15000, unit: 'pcs', unitCost: 0.35 },
  { id: 'INV004', material: 'Paint — Interior Emulsion', category: 'Paint', stock: 28, allocated: 12, reorderLevel: 30, unit: 'drums', unitCost: 95 },
  { id: 'INV005', material: 'Timber — Roof Trusses', category: 'Timber', stock: 145, allocated: 60, reorderLevel: 100, unit: 'm³', unitCost: 420 },
  { id: 'INV006', material: 'PVC Pipes 110mm', category: 'Pipes', stock: 85, allocated: 30, reorderLevel: 50, unit: 'm', unitCost: 12.5 },
  { id: 'INV007', material: 'IBR Roofing Sheets', category: 'Roofing', stock: 320, allocated: 200, reorderLevel: 250, unit: 'm²', unitCost: 18.5 },
  { id: 'INV008', material: 'Electrical Cable 6mm²', category: 'Electrical', stock: 480, allocated: 150, reorderLevel: 300, unit: 'm', unitCost: 2.8 },
  { id: 'INV009', material: 'Sand — River Sand', category: 'Aggregates', stock: 65, allocated: 20, reorderLevel: 40, unit: 'm³', unitCost: 25 },
  { id: 'INV010', material: 'Aggregate 3/4"', category: 'Aggregates', stock: 12, allocated: 8, reorderLevel: 30, unit: 'm³', unitCost: 32 },
];

// ── Finance ──────────────────────────────────────────────────
export interface Invoice {
  id: string;
  client: string;
  project: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: 'Paid' | 'Outstanding' | 'Overdue' | 'Partial';
  paidAmount: number;
}

export const invoices: Invoice[] = [
  { id: 'INV-2026-001', client: 'Mukamuri Holdings', project: 'Riverside Office Development', amount: 540000, issuedDate: '2026-03-15', dueDate: '2026-04-15', status: 'Paid', paidAmount: 540000 },
  { id: 'INV-2026-002', client: 'Mukamuri Holdings', project: 'Riverside Office Development', amount: 540000, issuedDate: '2026-06-15', dueDate: '2026-07-15', status: 'Paid', paidAmount: 540000 },
  { id: 'INV-2026-003', client: 'Mukamuri Holdings', project: 'Riverside Office Development', amount: 360000, issuedDate: '2026-09-01', dueDate: '2026-10-01', status: 'Outstanding', paidAmount: 0 },
  { id: 'INV-2026-004', client: 'Nyathi Investments', project: 'Harare Residential Complex', amount: 412500, issuedDate: '2026-05-01', dueDate: '2026-06-01', status: 'Paid', paidAmount: 412500 },
  { id: 'INV-2026-005', client: 'Nyathi Investments', project: 'Harare Residential Complex', amount: 412500, issuedDate: '2026-08-01', dueDate: '2026-09-01', status: 'Overdue', paidAmount: 0 },
  { id: 'INV-2026-006', client: 'Marufu Group', project: 'Westgate Retail Renovation', amount: 360000, issuedDate: '2026-02-01', dueDate: '2026-03-01', status: 'Paid', paidAmount: 360000 },
  { id: 'INV-2026-007', client: 'Marufu Group', project: 'Westgate Retail Renovation', amount: 180000, issuedDate: '2026-07-01', dueDate: '2026-08-01', status: 'Partial', paidAmount: 102000 },
  { id: 'INV-2026-008', client: 'Chigumba Properties', project: 'Borrowdale Villa Project', amount: 380000, issuedDate: '2026-03-20', dueDate: '2026-04-20', status: 'Paid', paidAmount: 380000 },
  { id: 'INV-2026-009', client: 'Chigumba Properties', project: 'Borrowdale Villa Project', amount: 285000, issuedDate: '2026-07-20', dueDate: '2026-08-20', status: 'Overdue', paidAmount: 0 },
];

export interface Expense {
  id: string;
  description: string;
  project: string;
  category: string;
  amount: number;
  date: string;
}

export const expenses: Expense[] = [
  { id: 'EX001', description: 'Cement delivery — 500 bags', project: 'Riverside Office Development', category: 'Materials', amount: 7250, date: '2026-09-08' },
  { id: 'EX002', description: 'Crane rental — September', project: 'Riverside Office Development', category: 'Equipment', amount: 13500, date: '2026-09-05' },
  { id: 'EX003', description: 'Masonry labour — September', project: 'Harare Residential Complex', category: 'Labour', amount: 28000, date: '2026-09-03' },
  { id: 'EX004', description: 'Electrical subcontractor', project: 'Westgate Retail Renovation', category: 'Subcontractor', amount: 18000, date: '2026-09-02' },
  { id: 'EX005', description: 'Roofing sheets — 850m²', project: 'Riverside Office Development', category: 'Materials', amount: 15725, date: '2026-09-07' },
  { id: 'EX006', description: 'Excavator rental — 15 days', project: 'Harare Residential Complex', category: 'Equipment', amount: 5700, date: '2026-09-01' },
  { id: 'EX007', description: 'Paint — Exterior 40 drums', project: 'Borrowdale Villa Project', category: 'Materials', amount: 4800, date: '2026-09-06' },
  { id: 'EX008', description: 'Plumbing subcontractor — Phase 1', project: 'Riverside Office Development', category: 'Subcontractor', amount: 24000, date: '2026-09-04' },
];

// ── Risk Register ────────────────────────────────────────────
export interface Risk {
  id: string;
  risk: string;
  project: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  owner: string;
  status: 'Open' | 'Mitigated' | 'Closed';
  mitigation: string;
}

export const risks: Risk[] = [
  { id: 'R001', risk: 'Steel price increase affecting budget', project: 'Harare Residential Complex', probability: 'High', impact: 'High', owner: 'Kudzai Chirwa', status: 'Open', mitigation: 'Negotiating fixed-price contract with Steelmasters' },
  { id: 'R002', risk: 'Heavy rains delaying foundation work', project: 'Riverside Office Development', probability: 'Medium', impact: 'Medium', owner: 'Tafadzwa Moyo', status: 'Mitigated', mitigation: 'Scheduled foundation pour for dry window, tarpaulins on standby' },
  { id: 'R003', risk: 'Client scope changes — villa design', project: 'Borrowdale Villa Project', probability: 'High', impact: 'Medium', owner: 'Tafadzwa Moyo', status: 'Open', mitigation: 'Change order process documented, client briefed on cost implications' },
  { id: 'R004', risk: 'Supplier delivery delays — roofing', project: 'Riverside Office Development', probability: 'Medium', impact: 'High', owner: 'Nomsa Dube', status: 'Open', mitigation: 'Alternative supplier identified (Timber World)' },
  { id: 'R005', risk: 'Labour shortage — masonry team', project: 'Harare Residential Complex', probability: 'Medium', impact: 'Medium', owner: 'Kudzai Chirwa', status: 'Mitigated', mitigation: 'Additional masons contracted from workshop pool' },
  { id: 'R006', risk: 'Electrical inspection failure', project: 'Westgate Retail Renovation', probability: 'Low', impact: 'High', owner: 'Nomsa Dube', status: 'Closed', mitigation: 'Pre-inspection completed, all corrections made' },
];

export interface QualityIssue {
  id: string;
  type: 'Issue' | 'Snag' | 'Defect' | 'Safety Observation';
  description: string;
  project: string;
  location: string;
  reportedBy: string;
  date: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  action: string;
}

export const qualityIssues: QualityIssue[] = [
  { id: 'Q001', type: 'Snag', description: 'Crack in plaster — Block C, Unit 4', project: 'Harare Residential Complex', location: 'Unit 4, Block C', reportedBy: 'Kudzai Chirwa', date: '2026-09-06', status: 'Open', action: 'Re-plaster affected area after crack assessment' },
  { id: 'Q002', type: 'Defect', description: 'Uneven floor slab — Section B', project: 'Riverside Office Development', location: 'Ground Floor, Section B', reportedBy: 'Tafadzwa Moyo', date: '2026-09-04', status: 'In Progress', action: 'Self-levelling compound to be applied' },
  { id: 'Q003', type: 'Safety Observation', description: 'Missing edge protection — Level 2 stairwell', project: 'Riverside Office Development', location: 'Level 2, Stairwell A', reportedBy: 'Safety Officer', date: '2026-09-07', status: 'Open', action: 'Install temporary guardrails immediately' },
  { id: 'Q004', type: 'Issue', description: 'Window frame alignment — Unit 12', project: 'Borrowdale Villa Project', location: 'Master Bedroom', reportedBy: 'Tafadzwa Moyo', date: '2026-09-02', status: 'Resolved', action: 'Frames re-aligned and re-sealed' },
  { id: 'Q005', type: 'Defect', description: 'Paint bubbling — exterior wall', project: 'Westgate Retail Renovation', location: 'South Facade', reportedBy: 'Nomsa Dube', date: '2026-08-28', status: 'In Progress', action: 'Scrape, prime with sealer, repaint' },
  { id: 'Q006', type: 'Safety Observation', description: 'PPE non-compliance — subcontractor team', project: 'Harare Residential Complex', location: 'Site', reportedBy: 'Safety Officer', date: '2026-09-05', status: 'Resolved', action: 'Toolbox talk conducted, PPE issued to all workers' },
];

// ── HR / Staff ───────────────────────────────────────────────
export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Suspended';
  assignedProject: string;
}

export const staff: Staff[] = [
  { id: 'EMP001', name: 'Tafadzwa Moyo', role: 'Project Manager', department: 'Management', phone: '+263 77 111 2222', email: 'tafadzwa@conos.co.zw', status: 'Active', assignedProject: 'Riverside Office Development' },
  { id: 'EMP002', name: 'Kudzai Chirwa', role: 'Site Manager', department: 'Operations', phone: '+263 71 222 3333', email: 'kudzai@conos.co.zw', status: 'Active', assignedProject: 'Harare Residential Complex' },
  { id: 'EMP003', name: 'Nomsa Dube', role: 'Site Supervisor', department: 'Operations', phone: '+263 78 333 4444', email: 'nomsa@conos.co.zw', status: 'Active', assignedProject: 'Westgate Retail Renovation' },
  { id: 'EMP004', name: 'Farai Gumbo', role: 'Quantity Surveyor', department: 'Finance', phone: '+263 77 444 5555', email: 'farai.g@conos.co.zw', status: 'Active', assignedProject: 'Multiple' },
  { id: 'EMP005', name: 'Ruth Madziva', role: 'Procurement Officer', department: 'Procurement', phone: '+263 71 555 6666', email: 'ruth@conos.co.zw', status: 'Active', assignedProject: 'Multiple' },
  { id: 'EMP006', name: 'Alex Zhou', role: 'Electrician', department: 'Electrical', phone: '+263 78 666 7777', email: 'alex@conos.co.zw', status: 'Active', assignedProject: 'Westgate Retail Renovation' },
  { id: 'EMP007', name: 'Brian Chiweshe', role: 'Carpenter', department: 'Carpentry', phone: '+263 77 777 8888', email: 'brian.c@conos.co.zw', status: 'On Leave', assignedProject: 'Borrowdale Villa Project' },
  { id: 'EMP008', name: 'Susan Ncube', role: 'Safety Officer', department: 'Safety', phone: '+263 71 888 9999', email: 'susan@conos.co.zw', status: 'Active', assignedProject: 'Multiple' },
  { id: 'EMP009', name: 'Peter Chauke', role: 'Mason', department: 'Masonry', phone: '+263 78 999 0000', email: 'peter@conos.co.zw', status: 'Active', assignedProject: 'Harare Residential Complex' },
  { id: 'EMP010', name: 'Mary Sibanda', role: 'Accountant', department: 'Finance', phone: '+263 77 000 1111', email: 'mary@conos.co.zw', status: 'Active', assignedProject: 'Multiple' },
];

// ── Workshop ─────────────────────────────────────────────────
export interface WorkOrder {
  id: string;
  title: string;
  department: string;
  assignedTo: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
}

export const workOrders: WorkOrder[] = [
  { id: 'WO001', title: 'Fabricate window frames — 24 units', department: 'Carpentry', assignedTo: 'Brian Chiweshe', priority: 'High', status: 'In Progress', dueDate: '2026-09-18' },
  { id: 'WO002', title: 'Repair concrete mixer #3', department: 'Mechanical', assignedTo: 'Workshop Team', priority: 'High', status: 'Pending', dueDate: '2026-09-12' },
  { id: 'WO003', title: 'Sharpen and service drill bits', department: 'Mechanical', assignedTo: 'Workshop Team', priority: 'Low', status: 'Completed', dueDate: '2026-09-05' },
  { id: 'WO004', title: 'Build formwork — foundation sections', department: 'Carpentry', assignedTo: 'Brian Chiweshe', priority: 'Medium', status: 'Pending', dueDate: '2026-09-20' },
  { id: 'WO005', title: 'Service welding equipment', department: 'Mechanical', assignedTo: 'Workshop Team', priority: 'Medium', status: 'In Progress', dueDate: '2026-09-15' },
];

// ── Equipment ────────────────────────────────────────────────
export interface Equipment {
  id: string;
  name: string;
  type: string;
  project: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Needs Repair';
  lastService: string;
  nextService: string;
  status: 'In Use' | 'Available' | 'Under Maintenance';
}

export const equipment: Equipment[] = [
  { id: 'EQ001', name: 'CAT 320 Excavator', type: 'Excavator', project: 'Harare Residential Complex', condition: 'Good', lastService: '2026-08-15', nextService: '2026-11-15', status: 'In Use' },
  { id: 'EQ002', name: 'Mobile Crane 25T', type: 'Crane', project: 'Riverside Office Development', condition: 'Excellent', lastService: '2026-08-20', nextService: '2026-11-20', status: 'In Use' },
  { id: 'EQ003', name: 'Concrete Mixer #1', type: 'Mixer', project: 'Borrowdale Villa Project', condition: 'Good', lastService: '2026-07-10', nextService: '2026-10-10', status: 'In Use' },
  { id: 'EQ004', name: 'Concrete Mixer #3', type: 'Mixer', project: 'Workshop', condition: 'Needs Repair', lastService: '2026-06-05', nextService: '2026-09-05', status: 'Under Maintenance' },
  { id: 'EQ005', name: 'Bobcat Skid Steer', type: 'Loader', project: 'Westgate Retail Renovation', condition: 'Fair', lastService: '2026-07-25', nextService: '2026-10-25', status: 'In Use' },
  { id: 'EQ006', name: 'Scaffolding Set A', type: 'Scaffolding', project: 'Riverside Office Development', condition: 'Good', lastService: '2026-08-01', nextService: '2026-11-01', status: 'In Use' },
  { id: 'EQ007', name: 'Welding Machine 200A', type: 'Welder', project: 'Workshop', condition: 'Excellent', lastService: '2026-08-30', nextService: '2026-11-30', status: 'Available' },
  { id: 'EQ008', name: 'Vibratory Roller', type: 'Compactor', project: 'Available', condition: 'Good', lastService: '2026-08-10', nextService: '2026-11-10', status: 'Available' },
];

// ── Communications ───────────────────────────────────────────
export interface Message {
  id: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  from: string;
  to: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
}

export const messages: Message[] = [
  { id: 'M001', channel: 'WhatsApp', from: 'James Mukamuri', to: 'Construction OS', subject: 'Riverside Project Update', preview: 'Hi, can we schedule a site visit next week? I want to see the progress on the 2nd floor...', time: '10:42 AM', unread: true },
  { id: 'M002', channel: 'Email', from: 'Sarah Chigumba', to: 'Construction OS', subject: 'Invoice INV-2026-009 — Outstanding', preview: 'Dear team, I noticed the invoice is overdue. Can we arrange a payment plan?...', time: '09:15 AM', unread: true },
  { id: 'M003', channel: 'SMS', from: 'Robert Marufu', to: 'Construction OS', subject: 'Payment Confirmation', preview: 'Payment of $78,000 has been transferred. Reference: MARU7890...', time: '08:30 AM', unread: false },
  { id: 'M004', channel: 'WhatsApp', from: 'Tendai Nyathi', to: 'Construction OS', subject: 'Steel Delivery', preview: 'When will the steel arrive on site? The masons are waiting...', time: 'Yesterday', unread: false },
  { id: 'M005', channel: 'Email', from: 'Pioneer Cement', to: 'Construction OS', subject: 'Order Confirmation — PR001', preview: 'Your order for 500 bags of OPC Cement has been confirmed. Delivery scheduled for...', time: 'Yesterday', unread: false },
  { id: 'M006', channel: 'WhatsApp', from: 'Patricia Sibanda', to: 'Construction OS', subject: 'Enquiry Follow-up', preview: 'Thank you for the quotation. I need a few days to review with my partners...', time: '2 days ago', unread: false },
  { id: 'M007', channel: 'SMS', from: 'Kudzai Chirwa', to: 'Construction OS', subject: 'Site Issue', preview: 'We have a crack in Block C plaster. Need QS to assess urgently...', time: '2 days ago', unread: false },
  { id: 'M008', channel: 'Email', from: 'Steelmasters ZW', to: 'Construction OS', subject: 'Price Update — Reinforcement Steel', preview: 'Please note a 7% price increase effective 1 October 2026. Current orders will be honored at...', time: '3 days ago', unread: false },
];

// ── Recent Activity ──────────────────────────────────────────
export interface Activity {
  id: string;
  type: 'project' | 'task' | 'finance' | 'procurement' | 'client' | 'risk';
  message: string;
  time: string;
  user: string;
}

export const recentActivity: Activity[] = [
  { id: 'A001', type: 'procurement', message: 'Purchase request PR004 submitted for Ready-Mix Concrete', time: '15 min ago', user: 'Tafadzwa Moyo' },
  { id: 'A002', type: 'finance', message: 'Invoice INV-2026-003 issued to Mukamuri Holdings — $360,000', time: '1 hour ago', user: 'Mary Sibanda' },
  { id: 'A003', type: 'task', message: 'Task "Pour concrete foundation — Section B" moved to In Progress', time: '2 hours ago', user: 'Tafadzwa Moyo' },
  { id: 'A004', type: 'risk', message: 'New safety observation: Missing edge protection — Level 2 stairwell', time: '3 hours ago', user: 'Susan Ncube' },
  { id: 'A005', type: 'client', message: 'New enquiry from Patricia Sibanda — Highfield Apartments Complex', time: '5 hours ago', user: 'System' },
  { id: 'A006', type: 'project', message: 'Borrowdale Villa Project progress updated to 55%', time: '6 hours ago', user: 'Tafadzwa Moyo' },
  { id: 'A007', type: 'finance', message: 'Payment received from Robert Marufu — $78,000', time: '8 hours ago', user: 'Mary Sibanda' },
  { id: 'A008', type: 'procurement', message: 'Delivery confirmed: Aluminium Window Frames (24 pcs)', time: 'Yesterday', user: 'Tafadzwa Moyo' },
];

// ── Project Updates (for project detail tabs) ────────────────
export interface ProjectUpdate {
  id: string;
  projectId: string;
  date: string;
  author: string;
  message: string;
  type: 'progress' | 'issue' | 'client' | 'milestone';
}

export const projectUpdates: ProjectUpdate[] = [
  { id: 'PU001', projectId: 'P001', date: '2026-09-09', author: 'Tafadzwa Moyo', message: 'Section B foundation pour 80% complete. Curing period 7 days before stripping formwork.', type: 'progress' },
  { id: 'PU002', projectId: 'P001', date: '2026-09-07', author: 'Susan Ncube', message: 'Safety observation raised: Missing edge protection at Level 2 stairwell. Action assigned.', type: 'issue' },
  { id: 'PU003', projectId: 'P001', date: '2026-09-05', author: 'Tafadzwa Moyo', message: 'Client site visit completed. Mr. Mukamuri satisfied with progress on ground floor.', type: 'client' },
  { id: 'PU004', projectId: 'P001', date: '2026-09-01', author: 'Tafadzwa Moyo', message: 'Milestone: First floor slab cast successfully. Moving to column erection phase.', type: 'milestone' },
  { id: 'PU005', projectId: 'P002', date: '2026-09-06', author: 'Kudzai Chirwa', message: 'Plastering in Block C delayed due to snag — crack identified. QS assessing.', type: 'issue' },
  { id: 'PU006', projectId: 'P002', date: '2026-09-03', author: 'Kudzai Chirwa', message: 'Roof truss fabrication 60% complete in workshop. Installation scheduled for end of month.', type: 'progress' },
  { id: 'PU007', projectId: 'P003', date: '2026-09-08', author: 'Nomsa Dube', message: 'Client walkthrough of ground floor completed. Minor snag list generated.', type: 'client' },
  { id: 'PU008', projectId: 'P003', date: '2026-09-02', author: 'Nomsa Dube', message: 'Electrical first fix 100% complete. Ready for inspection scheduling.', type: 'milestone' },
  { id: 'PU009', projectId: 'P004', date: '2026-09-05', author: 'Tafadzwa Moyo', message: 'Pool excavation complete. Waterproofing membrane being applied.', type: 'progress' },
  { id: 'PU010', projectId: 'P004', date: '2026-09-02', author: 'Tafadzwa Moyo', message: 'Window frame alignment issue in master bedroom resolved. Re-sealed and inspected.', type: 'issue' },
];

// ── Project Documents (mock) ─────────────────────────────────
export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: 'Contract' | 'Drawing' | 'Permit' | 'BOQ' | 'Invoice' | 'Report' | 'Photo';
  date: string;
  size: string;
}

export const projectDocuments: ProjectDocument[] = [
  { id: 'D001', projectId: 'P001', name: 'Main Contract — Mukamuri Holdings.pdf', type: 'Contract', date: '2026-02-28', size: '2.4 MB' },
  { id: 'D002', projectId: 'P001', name: 'Architectural Drawings Rev 3.dwg', type: 'Drawing', date: '2026-03-10', size: '18.7 MB' },
  { id: 'D003', projectId: 'P001', name: 'Building Permit — City of Harare.pdf', type: 'Permit', date: '2026-02-20', size: '1.1 MB' },
  { id: 'D004', projectId: 'P001', name: 'BOQ — Riverside Office.pdf', type: 'BOQ', date: '2026-02-15', size: '845 KB' },
  { id: 'D005', projectId: 'P001', name: 'Site Progress — September.pdf', type: 'Report', date: '2026-09-05', size: '3.2 MB' },
  { id: 'D006', projectId: 'P001', name: 'Foundation Pour Photo.jpg', type: 'Photo', date: '2026-09-01', size: '5.8 MB' },
  { id: 'D007', projectId: 'P002', name: 'Main Contract — Nyathi Investments.pdf', type: 'Contract', date: '2026-04-10', size: '2.1 MB' },
  { id: 'D008', projectId: 'P002', name: 'Site Plan — Borrowdale.dwg', type: 'Drawing', date: '2026-04-05', size: '12.3 MB' },
  { id: 'D009', projectId: 'P003', name: 'Renovation Scope — Marufu.pdf', type: 'Contract', date: '2026-01-05', size: '1.8 MB' },
  { id: 'D010', projectId: 'P004', name: 'Villa Design — Chigumba.pdf', type: 'Drawing', date: '2026-02-15', size: '15.2 MB' },
];

// ── Revenue vs Cost (monthly, for chart) ─────────────────────
export const revenueCostData = [
  { month: 'Mar', revenue: 540000, cost: 380000 },
  { month: 'Apr', revenue: 540000, cost: 410000 },
  { month: 'May', revenue: 412500, cost: 290000 },
  { month: 'Jun', revenue: 540000, cost: 450000 },
  { month: 'Jul', revenue: 565000, cost: 420000 },
  { month: 'Aug', revenue: 412500, cost: 380000 },
  { month: 'Sep', revenue: 360000, cost: 310000 },
];

// ── Notifications ────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  read: boolean;
}

export const notifications: Notification[] = [
  { id: 'N001', title: 'Overdue Task', message: 'Order steel reinforcement bars — Harare Residential Complex', time: '5 min ago', type: 'alert', read: false },
  { id: 'N002', title: 'Invoice Overdue', message: 'INV-2026-005 — Nyathi Investments — $412,500', time: '1 hour ago', type: 'warning', read: false },
  { id: 'N003', title: 'New Enquiry', message: 'Patricia Sibanda submitted a new enquiry — Highfield Apartments', time: '3 hours ago', type: 'info', read: false },
  { id: 'N004', title: 'Payment Received', message: 'Robert Marufu paid $78,000 — INV-2026-007', time: '5 hours ago', type: 'success', read: true },
  { id: 'N005', title: 'Safety Alert', message: 'Missing edge protection — Riverside Office, Level 2', time: '6 hours ago', type: 'alert', read: true },
  { id: 'N006', title: 'Low Stock', message: 'Aggregate 3/4" below reorder level (12m³ remaining)', time: '8 hours ago', type: 'warning', read: true },
];

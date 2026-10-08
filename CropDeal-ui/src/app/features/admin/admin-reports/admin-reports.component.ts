import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

export type ReportEntityType = 'farmers' | 'dealers' | 'crops' | 'orders' | 'payments';

interface ReportMeta {
  type: ReportEntityType;
  title: string;
  subtitle: string;
  icon: string;
  themeColor: string;
  endpointJson: string;
  endpointCsv: string;
  fields: string[];
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminReportsComponent implements OnInit {
  reportCards: ReportMeta[] = [
    {
      type: 'farmers',
      title: 'Farmers Production & Valuation Report',
      subtitle: 'Farmer acreages, active crop listings, and produce inventory valuation',
      icon: 'fa-solid fa-tractor',
      themeColor: 'green',
      endpointJson: '/api/admin/reports/farmers',
      endpointCsv: '/api/admin/reports/farmers/csv',
      fields: ['Farmer ID', 'Name', 'Phone', 'Address', 'Farm Location', 'Total Crops Listed', 'Estimated Crop Value']
    },
    {
      type: 'dealers',
      title: 'Dealers Procurement & Spend Report',
      subtitle: 'Commercial buyer purchase activity, total procurement volume, and expenditure',
      icon: 'fa-solid fa-building-wheat',
      themeColor: 'navy',
      endpointJson: '/api/admin/reports/dealers',
      endpointCsv: '/api/admin/reports/dealers/csv',
      fields: ['Dealer ID', 'Name', 'Phone', 'Business Name', 'Address', 'Total Orders Placed', 'Total Amount Spent']
    },
    {
      type: 'crops',
      title: 'Crop Inventory & Mandi Pricing Report',
      subtitle: 'Platform catalog inventory, quality grades (A/B/C), state/district distribution, and pricing',
      icon: 'fa-solid fa-seedling',
      themeColor: 'emerald',
      endpointJson: '/api/admin/reports/crops',
      endpointCsv: '/api/admin/reports/crops/csv',
      fields: ['Crop ID', 'Commodity', 'State', 'District', 'Grade', 'Quantity (KG)', 'Price/KG', 'Status']
    },
    {
      type: 'orders',
      title: 'Orders Lifecycle & Fulfillment Report',
      subtitle: 'End-to-end order tracking, dealer-farmer matches, GMV valuation, and delivery states',
      icon: 'fa-solid fa-boxes-packing',
      themeColor: 'teal',
      endpointJson: '/api/admin/reports/orders',
      endpointCsv: '/api/admin/reports/orders/csv',
      fields: ['Order ID', 'Dealer ID', 'Farmer ID', 'Crop Name', 'Quantity', 'Unit Price', 'Total Amount', 'Status', 'Created At']
    },
    {
      type: 'payments',
      title: 'Payments Ledger & Financial Audit Report',
      subtitle: 'Complete transaction ledger, settlement channels, transaction references, and escrow timestamps',
      icon: 'fa-solid fa-receipt',
      themeColor: 'gold',
      endpointJson: '/api/admin/reports/payments',
      endpointCsv: '/api/admin/reports/payments/csv',
      fields: ['Payment ID', 'Order ID', 'Dealer ID', 'Farmer ID', 'Amount', 'Payment Method', 'Status', 'Transaction Ref', 'Paid At']
    }
  ];

  activeReport: ReportMeta | null = null;
  reportData: any[] = [];
  filteredReportData: any[] = [];
  tableColumns: string[] = [];

  isLoading = false;
  isDownloadingCsv: Record<string, boolean> = {};
  searchQuery = '';

  constructor(
    private adminService: AdminService,
    private notifService: NotificationService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Default load the first report (farmers) so user immediately sees live data
    this.viewReport(this.reportCards[0]);
  }

  viewReport(meta: ReportMeta): void {
    this.activeReport = meta;
    this.reportData = [];
    this.filteredReportData = [];
    this.tableColumns = [];
    this.searchQuery = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    switch (meta.type) {
      case 'farmers':
        this.adminService.getFarmersReport().subscribe(data => this.handleReportData(data));
        break;
      case 'dealers':
        this.adminService.getDealersReport().subscribe(data => this.handleReportData(data));
        break;
      case 'crops':
        this.adminService.getCropsReport().subscribe(data => this.handleReportData(data));
        break;
      case 'orders':
        this.adminService.getOrdersReport().subscribe(data => this.handleReportData(data));
        break;
      case 'payments':
        this.adminService.getPaymentsReport().subscribe(data => this.handleReportData(data));
        break;
    }
  }

  private handleReportData(data: any[]): void {
    this.reportData = data || [];
    this.filteredReportData = [...this.reportData];

    if (this.reportData.length > 0) {
      this.tableColumns = Object.keys(this.reportData[0]);
    } else {
      this.tableColumns = [];
    }

    this.isLoading = false;
    this.cdr.markForCheck();
  }

  onSearchChange(): void {
    if (!this.searchQuery.trim()) {
      this.filteredReportData = [...this.reportData];
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.filteredReportData = this.reportData.filter(row =>
        Object.values(row).some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }
    this.cdr.markForCheck();
  }

  downloadCsv(meta: ReportMeta, event?: Event): void {
    if (event) event.stopPropagation();

    this.isDownloadingCsv[meta.type] = true;
    this.cdr.markForCheck();

    this.adminService.exportReportCsv(meta.type).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CropDeal_${meta.type}_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.isDownloadingCsv[meta.type] = false;
        this.cdr.markForCheck();
        this.notifService.showToast('success', `Exported ${meta.title} as CSV`);
      },
      error: () => {
        this.isDownloadingCsv[meta.type] = false;
        this.cdr.markForCheck();
        this.notifService.showToast('error', `Failed to download CSV for ${meta.title}`);
      }
    });
  }

  formatHeader(col: string): string {
    return col
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatCell(row: any, col: string): string {
    const val = row[col];
    if (val === null || val === undefined) return '-';

    const colLower = col.toLowerCase();
    if (
      colLower.includes('amount') ||
      colLower.includes('price') ||
      colLower.includes('value') ||
      colLower.includes('revenue') ||
      colLower.includes('spend')
    ) {
      const num = Number(val);
      if (!isNaN(num)) {
        return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    return String(val);
  }

  isStatusColumn(col: string): boolean {
    return col.toLowerCase() === 'status';
  }
}

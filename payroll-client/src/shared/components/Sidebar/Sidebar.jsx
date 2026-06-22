import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  LayoutDashboard,
  Settings,
  FileEdit,
  FileText,
  Wrench,
  ListTodo,
  FileCheck,
  UserCheck,
  User,
  PlusCircle,
  Building2,
  Users,
  Fingerprint,
  Briefcase,
  MapPin,
  Package,
  Coins,
  Percent,
  Wallet,
  Sliders,
  Calendar,
  CalendarCheck,
  UserMinus,
  UserCog,
  FileUp,
  FileDown,
  Printer,
  AlertCircle,
  Trash2,
  Save,
  RefreshCw,
  Link,
  UserX,
  Notebook,
  FileSpreadsheet,
  Folder,
  ClipboardList
} from 'lucide-react';
import styles from './Sidebar.module.css';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  {
    name: 'Master',
    icon: User,
    subItems: [
      { name: 'Company', icon: Building2 },
      { name: 'Employee', icon: Users },
      { name: 'KYC Update', icon: Fingerprint },
      { name: 'Contractor', icon: Briefcase },
      { name: 'Address', icon: MapPin }
    ]
  },
  {
    name: 'Setup',
    icon: Settings,
    subItems: [
      { name: 'Packing Wages', icon: Package },
      { name: 'Bidi Roller Wages', icon: Coins },
      { name: 'Professional Tax', icon: Percent },
      { name: 'Office Staff Salary', icon: Wallet },
      { name: 'Challan Setup', icon: Sliders }
    ]
  },
  {
    name: 'Attendance',
    icon: CalendarCheck,
    subItems: [
      { name: 'Attendence List', icon: ClipboardList },
      { name: 'Face Attendance (Self)', icon: Fingerprint },
      { name: 'Office Attendance', icon: Users },
      { name: 'Packing Attendance', icon: Package },
      { name: 'Bidi Roller Attendance', icon: User }
    ]
  },
  {
    name: 'Entry',
    icon: FileEdit,
    subItems: [
      { name: 'Office Staff', icon: Users },
      { name: 'Packers', icon: Package },
      { name: 'Bidi Roller', icon: User },
      { name: 'EPF Challan Date', icon: Calendar },
      { name: 'Resignation', icon: UserMinus }
    ]
  },
  {
    name: 'Report',
    icon: Sliders,
    subItems: [
      {
        name: 'Salary Sheet',
        icon: Folder,
        nestedItems: [
          { name: 'Office Salary', icon: Wallet },
          { name: 'Packing Salary', icon: Package },
          { name: 'Contractor Salary', icon: Briefcase }
        ]
      },
      {
        name: 'Forms',
        icon: Folder,
        nestedItems: [
          { name: 'Form 2', icon: FileText },
          { name: 'Form 3A', icon: FileSpreadsheet },
          { name: 'Form 5', icon: ClipboardList },
          { name: 'Form 10', icon: Notebook },
          { name: 'Form 11', icon: FileCheck },
          { name: 'PF Claim Form', icon: FileEdit }
        ]
      },
      { name: 'ECR Report', icon: PlusCircle },
      { name: 'ESIC Report', icon: PlusCircle },
      { name: 'PMRPY Report', icon: PlusCircle },
      { name: 'PF Challan Yearly', icon: PlusCircle },
      { name: 'ESIC Challan Yearly', icon: PlusCircle },
      { name: 'EPF Challan', icon: PlusCircle },
      { name: 'PF Summary', icon: PlusCircle },
      { name: 'Payment Advice', icon: PlusCircle },
      { name: 'Bonus Sheet', icon: PlusCircle },
      { name: 'Gratuity Calculation', icon: PlusCircle },
      { name: 'Professional Tax', icon: PlusCircle }
    ]
  },
  {
    name: 'Utility',
    icon: Wrench,
    subItems: [
      { name: 'Calender', icon: Calendar },
      { name: 'User Management', icon: UserCog },
      { name: 'Employee Data Import', icon: FileUp },
      { name: 'Employee Data Export', icon: FileDown },
      { name: 'KYC Export', icon: Fingerprint },
      { name: 'Attandance Printing', icon: Printer },
      { name: 'Missing Information', icon: AlertCircle },
      { name: 'Delete Month Entry', icon: Trash2 },
      { name: 'Backup', icon: Save },
      { name: 'Restore', icon: RefreshCw },
      { name: 'UAN to IP Mapping', icon: Link }
    ]
  },
  {
    name: 'Todo List',
    icon: ListTodo,
    subItems: [
      { name: '3 Month Absent List', icon: UserX },
      { name: '58 Years of age', icon: UserCheck },
      { name: 'Notes', icon: Notebook }
    ]
  },
  {
    name: 'Convert Excel To Text',
    icon: FileCheck,
    subItems: [
      { name: 'Excel To Text', icon: FileSpreadsheet }
    ]
  }
];

const Sidebar = ({ sidebarCollapsed, activeMenu, setActiveMenu, activeSubMenu, setActiveSubMenu }) => {
  const [expandedMenus, setExpandedMenus] = useState({});
  const [expandedSubMenus, setExpandedSubMenus] = useState({});

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarSectionTitle}>Main Navigation</div>
      <nav className={styles.sidebarNav}>
        {menuItems.map(item => {
          const IconComp = item.icon;
          const hasSubItems = !!item.subItems;
          const isExpanded = expandedMenus[item.name];
          const isActive = activeMenu === item.name;

          return (
            <div key={item.name} className={styles.menuItemWrapper}>
              <button
                className={`${styles.sidebarItem} ${isActive ? styles.activeItem : ''}`}
                onClick={() => {
                  if (hasSubItems && !sidebarCollapsed) {
                    setExpandedMenus(prev => ({
                      ...prev,
                      [item.name]: !prev[item.name]
                    }));
                  } else {
                    setActiveMenu(item.name);
                    setActiveSubMenu('');
                  }
                }}
              >
                <IconComp size={18} className={styles.sidebarIcon} />
                <span className={styles.sidebarText}>{item.name}</span>
                {hasSubItems && !sidebarCollapsed && (
                  <ChevronRight
                    size={16}
                    className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                  />
                )}
              </button>

              {hasSubItems && isExpanded && !sidebarCollapsed && (
                <div className={styles.subMenuContainer}>
                  {item.subItems.map(sub => {
                    const isSubActive = activeSubMenu === sub.name;
                    const SubIcon = sub.icon;
                    const hasNestedItems = !!sub.nestedItems;
                    const isSubExpanded = expandedSubMenus[sub.name];

                    return (
                      <div key={sub.name} className={styles.subItemWrapper}>
                        <button
                          className={`${styles.subItem} ${isSubActive ? styles.activeSubItem : ''} ${hasNestedItems ? styles.formParentSubItem : ''}`}
                          onClick={() => {
                            if (hasNestedItems) {
                              setExpandedSubMenus(prev => ({
                                ...prev,
                                [sub.name]: !prev[sub.name]
                              }));
                            } else {
                              setActiveMenu(item.name);
                              setActiveSubMenu(sub.name);
                            }
                          }}
                        >
                          {hasNestedItems ? (
                            <>
                              <ChevronRight
                                size={14}
                                className={`${styles.leftChevron} ${isSubExpanded ? styles.leftChevronExpanded : ''}`}
                              />
                              <span>{sub.name}</span>
                            </>
                          ) : (
                            <>
                              <SubIcon size={16} className={styles.subIcon} />
                              <span>{sub.name}</span>
                            </>
                          )}
                        </button>

                        {hasNestedItems && isSubExpanded && (
                          <div className={styles.nestedMenuContainer}>
                            {sub.nestedItems.map(nested => {
                              const isNestedActive = activeSubMenu === nested.name;
                              const NestedIcon = nested.icon;
                              return (
                                <button
                                  key={nested.name}
                                  className={`${styles.nestedItem} ${isNestedActive ? styles.activeNestedItem : ''} ${styles.formNestedItem}`}
                                  onClick={() => {
                                    setActiveMenu(item.name);
                                    setActiveSubMenu(nested.name);
                                  }}
                                >
                                  <NestedIcon size={14} className={styles.nestedIcon} />
                                  <span>{nested.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

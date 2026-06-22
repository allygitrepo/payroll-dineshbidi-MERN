import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const nameToSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const getActiveMenuAndSubMenu = (pathname) => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0 || parts[0] === 'dashboard') {
    return { activeMenu: 'Dashboard', activeSubMenu: '' };
  }

  const moduleSlug = parts[0];
  const subMenuSlug = parts[1] || '';

  const matchedMenuItem = menuItems.find(item => nameToSlug(item.name) === moduleSlug);
  if (!matchedMenuItem) {
    return { activeMenu: '', activeSubMenu: '' };
  }

  const activeMenu = matchedMenuItem.name;
  let activeSubMenu = '';

  if (subMenuSlug && matchedMenuItem.subItems) {
    for (const sub of matchedMenuItem.subItems) {
      if (sub.nestedItems) {
        const matchedNested = sub.nestedItems.find(nested => nameToSlug(nested.name) === subMenuSlug);
        if (matchedNested) {
          activeSubMenu = matchedNested.name;
          break;
        }
      } else if (nameToSlug(sub.name) === subMenuSlug) {
        activeSubMenu = sub.name;
        break;
      }
    }
  }

  return { activeMenu, activeSubMenu };
};

const Sidebar = ({ sidebarCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMenu, activeSubMenu } = getActiveMenuAndSubMenu(location.pathname);

  const [expandedMenus, setExpandedMenus] = useState({});
  const [expandedSubMenus, setExpandedSubMenus] = useState({});

  useEffect(() => {
    if (activeMenu) {
      setExpandedMenus(prev => ({ ...prev, [activeMenu]: true }));
    }
    if (activeMenu && activeSubMenu) {
      const matchedMenuItem = menuItems.find(item => item.name === activeMenu);
      if (matchedMenuItem && matchedMenuItem.subItems) {
        const parentSub = matchedMenuItem.subItems.find(sub =>
          sub.nestedItems && sub.nestedItems.some(nested => nested.name === activeSubMenu)
        );
        if (parentSub) {
          setExpandedSubMenus(prev => ({ ...prev, [parentSub.name]: true }));
        }
      }
    }
  }, [location.pathname, activeMenu, activeSubMenu]);

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
                    navigate(item.name === 'Dashboard' ? '/dashboard' : `/${nameToSlug(item.name)}`);
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
                              navigate(`/${nameToSlug(item.name)}/${nameToSlug(sub.name)}`);
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
                                    navigate(`/${nameToSlug(item.name)}/${nameToSlug(nested.name)}`);
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

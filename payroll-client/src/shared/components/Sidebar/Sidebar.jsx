import React, { useState, useEffect } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
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
  ClipboardList,
  MessageCircle
} from 'lucide-react';
import styles from './Sidebar.module.css';

const WhatsAppIcon = ({ size = 24, className }) => (
  <img src="/wa-whatsapp-icon.png" width={size} height={size} alt="WhatsApp" className={className} />
);

export const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  {
    name: 'Master',
    icon: User,
    subItems: [
      { name: 'Company', icon: Building2 },
      { name: 'Employee', icon: Users },
      { name: 'KYC Update', icon: Fingerprint },
      { name: 'Contractor', icon: Briefcase },
      { name: 'Address', icon: MapPin },
      { name: 'Leave', icon: FileCheck }
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
      { name: 'Leave Management', icon: FileCheck },
      { name: 'Face Attendance (Self)', icon: Fingerprint }
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
      { name: 'WhatsApp Gateway', icon: WhatsAppIcon },
      { name: 'Employee Data Import', icon: FileUp },
      { name: 'Contractor Data Import', icon: FileUp },
      { name: 'Employee Data Export', icon: FileDown },
      { name: 'KYC Export', icon: Fingerprint },
      { name: 'Attandance Printing', icon: Printer },
      { name: 'Missing Information', icon: AlertCircle },
      { name: 'Delete Month Entry', icon: Trash2 },
      { name: 'Backup', icon: Save },
      { name: 'Restore', icon: RefreshCw },
      { name: 'UAN to IP Mapping', icon: Link },
      { name: 'UAN Member ID', icon: Fingerprint }
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
  },
  {
    name: 'Loan Management',
    icon: Coins,
    subItems: [
      { name: 'Loan Profile', icon: ClipboardList }
    ]
  }
];

export const nameToSlug = (name) => {
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

const Sidebar = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const location = useLocation();
  const { activeMenu, activeSubMenu } = getActiveMenuAndSubMenu(location.pathname);

  const handleLinkClick = () => {
    if (setSidebarCollapsed && window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  const [expandedMenus, setExpandedMenus] = useState({});
  const [expandedSubMenus, setExpandedSubMenus] = useState({});

  useEffect(() => {
    if (activeMenu) {
      setExpandedMenus({ [activeMenu]: true });
    }
    if (activeMenu && activeSubMenu) {
      const matchedMenuItem = menuItems.find(item => item.name === activeMenu);
      if (matchedMenuItem && matchedMenuItem.subItems) {
        const parentSub = matchedMenuItem.subItems.find(sub =>
          sub.nestedItems && sub.nestedItems.some(nested => nested.name === activeSubMenu)
        );
        if (parentSub) {
          setExpandedSubMenus({ [parentSub.name]: true });
        }
      }
    }
  }, [location.pathname, activeMenu, activeSubMenu]);

  // Extract permissions from localStorage
  const userStr = localStorage.getItem('user');
  let permissions = {};
  if (userStr) {
    try {
      const userObj = JSON.parse(userStr);
      let rawPermissions = null;
      if (userObj.role && userObj.role.permissions) {
        rawPermissions = userObj.role.permissions;
      } else if (userObj.permissions) {
        // Fallback for old mock format if any
        rawPermissions = userObj.permissions;
      }

      if (rawPermissions) {
        permissions = typeof rawPermissions === 'string' ? JSON.parse(rawPermissions) : rawPermissions;
      }
    } catch(e) {}
  }

  const roleName = userStr ? (JSON.parse(userStr)?.role?.name || '') : '';
  const isContractor = roleName === 'Contractor' || roleName === 'CONTRACTOR';
  const isAdmin = roleName.toUpperCase().startsWith('ADMIN') || roleName.toUpperCase().startsWith('OWNER');

  const hasReadPermission = (slug) => {
    if (isAdmin) return true; // Optionally bypass for admins
    
    if (Array.isArray(permissions)) {
      return permissions.includes(slug);
    }
    
    const perm = permissions[slug];
    if (typeof perm === 'boolean') return perm;
    if (typeof perm === 'object' && perm !== null) return !!perm.read;
    return false;
  };

  // Filter menuItems based on permissions and role
  const filteredMenuItems = menuItems.map(item => {
    let filteredSubItems = null;
    if (item.subItems) {
      filteredSubItems = item.subItems.map(sub => {

        if (sub.nestedItems) {
          // If the parent itself has permission (e.g., Salary Sheet), show it with all nested items
          if (hasReadPermission(nameToSlug(sub.name))) {
            return sub;
          }
          // Otherwise, filter nested items individually (e.g., Forms -> Form 2)
          const filteredNested = sub.nestedItems.filter(n => hasReadPermission(nameToSlug(n.name)));
          if (filteredNested.length > 0) {
            return { ...sub, nestedItems: filteredNested };
          }
          return null;
        } else {
          const slug = nameToSlug(sub.name);
          const hasPerm = hasReadPermission(slug) || (isAdmin && slug === 'leave');
          return hasPerm ? sub : null;
        }
      }).filter(Boolean);
      
      if (filteredSubItems.length === 0) return null; // Hide parent if all children are hidden
    } else {
      if (!hasReadPermission(nameToSlug(item.name))) return null;
    }
    
    return { ...item, subItems: filteredSubItems };
  }).filter(Boolean);

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarSectionTitle}>Main Navigation</div>
      <nav className={styles.sidebarNav}>
        {filteredMenuItems.map(item => {
          const IconComp = item.icon;
          const hasSubItems = !!item.subItems;
          const isExpanded = expandedMenus[item.name];
          const isActive = activeMenu === item.name;
          const itemPath = item.name === 'Dashboard' ? '/dashboard' : `/${nameToSlug(item.name)}`;

          return (
            <div key={item.name} className={styles.menuItemWrapper}>
              {hasSubItems && !sidebarCollapsed ? (
                <button
                  className={`${styles.sidebarItem} ${isActive ? styles.activeItem : ''}`}
                  onClick={() => {
                    setExpandedMenus(prev => {
                      if (prev[item.name]) return {};
                      return { [item.name]: true };
                    });
                  }}
                >
                  <IconComp size={18} className={styles.sidebarIcon} />
                  <span className={styles.sidebarText}>{item.name}</span>
                  <ChevronRight
                    size={16}
                    className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                  />
                </button>
              ) : (
                <RouterLink
                  to={itemPath}
                  className={`${styles.sidebarItem} ${isActive ? styles.activeItem : ''}`}
                  onClick={handleLinkClick}
                >
                  <IconComp size={18} className={styles.sidebarIcon} />
                  <span className={styles.sidebarText}>{item.name}</span>
                  {hasSubItems && !sidebarCollapsed && (
                    <ChevronRight
                      size={16}
                      className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
                    />
                  )}
                </RouterLink>
              )}

              {hasSubItems && !sidebarCollapsed && (
                <div className={`${styles.subMenuWrapper} ${isExpanded ? styles.expanded : ''}`}>
                  <div className={styles.subMenuInner}>
                    <div className={styles.subMenuContainer}>
                      {item.subItems.map(sub => {
                    const isSubActive = activeSubMenu === sub.name;
                    const SubIcon = sub.icon;
                    const hasNestedItems = !!sub.nestedItems;
                    const isSubExpanded = expandedSubMenus[sub.name];
                    const subPath = `/${nameToSlug(item.name)}/${nameToSlug(sub.name)}`;

                    return (
                      <div key={sub.name} className={styles.subItemWrapper}>
                        {hasNestedItems ? (
                          <button
                            className={`${styles.subItem} ${isSubActive ? styles.activeSubItem : ''} ${styles.formParentSubItem}`}
                            onClick={() => {
                              setExpandedSubMenus(prev => {
                                if (prev[sub.name]) return {};
                                return { [sub.name]: true };
                              });
                            }}
                          >
                            <ChevronRight
                              size={14}
                              className={`${styles.leftChevron} ${isSubExpanded ? styles.leftChevronExpanded : ''}`}
                            />
                            <span>{sub.name}</span>
                          </button>
                        ) : (
                          <RouterLink
                            to={subPath}
                            className={`${styles.subItem} ${isSubActive ? styles.activeSubItem : ''}`}
                            onClick={handleLinkClick}
                          >
                            <SubIcon size={16} className={styles.subIcon} />
                            <span>{sub.name}</span>
                          </RouterLink>
                        )}

                        {hasNestedItems && (
                          <div className={`${styles.nestedMenuWrapper} ${isSubExpanded ? styles.expanded : ''}`}>
                            <div className={styles.nestedMenuInner}>
                              <div className={styles.nestedMenuContainer}>
                                {sub.nestedItems.map(nested => {
                              const isNestedActive = activeSubMenu === nested.name;
                              const NestedIcon = nested.icon;
                              const nestedPath = `/${nameToSlug(item.name)}/${nameToSlug(nested.name)}`;

                              return (
                                <RouterLink
                                  key={nested.name}
                                  to={nestedPath}
                                  className={`${styles.nestedItem} ${isNestedActive ? styles.activeNestedItem : ''} ${styles.formNestedItem}`}
                                  onClick={handleLinkClick}
                                >
                                  <NestedIcon size={14} className={styles.nestedIcon} />
                                  <span>{nested.name}</span>
                                </RouterLink>
                              );
                            })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                    </div>
                  </div>
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

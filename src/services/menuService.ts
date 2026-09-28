import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Menu } from '../types/database';
import { generateUUID } from '../utils/uuid';

const LOCAL_STORAGE_MENUS_KEY = 'rhythm_local_menus_v1';

export const DEFAULT_MENUS: Menu[] = [
  // 1. Home
  {
    id: 'm1-home',
    title: 'Home',
    slug: '/',
    parent_id: null,
    page_id: null,
    menu_type: 'internal',
    icon: 'Home',
    external_url: null,
    display_order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  // 2. About Us (Dropdown Parent)
  {
    id: 'm2-about',
    title: 'About Us',
    slug: '/about',
    parent_id: null,
    page_id: null,
    menu_type: 'dropdown_parent',
    icon: 'Building2',
    external_url: null,
    display_order: 2,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm2-about-history',
    title: 'Hospital History',
    slug: '/about/history',
    parent_id: 'm2-about',
    page_id: 'p-about-history',
    menu_type: 'internal',
    icon: 'History',
    external_url: null,
    display_order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm2-about-vision',
    title: 'Vision & Mission',
    slug: '/about/vision-mission',
    parent_id: 'm2-about',
    page_id: 'p-about-vision',
    menu_type: 'internal',
    icon: 'Target',
    external_url: null,
    display_order: 2,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm2-about-infra',
    title: 'Infrastructure',
    slug: '/about/infrastructure',
    parent_id: 'm2-about',
    page_id: 'p-about-infrastructure',
    menu_type: 'internal',
    icon: 'Layers',
    external_url: null,
    display_order: 3,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  // 3. Doctors
  {
    id: 'm3-doctors',
    title: 'Doctors',
    slug: '/doctors',
    parent_id: null,
    page_id: null,
    menu_type: 'internal',
    icon: 'Users',
    external_url: null,
    display_order: 3,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  // 4. Services (Dropdown Parent)
  {
    id: 'm4-services',
    title: 'Services',
    slug: '/services',
    parent_id: null,
    page_id: null,
    menu_type: 'dropdown_parent',
    icon: 'BriefcaseMedical',
    external_url: null,
    display_order: 4,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm4-cardiology',
    title: 'Cardiology',
    slug: '/services/cardiology',
    parent_id: 'm4-services',
    page_id: 'p-cardiology',
    menu_type: 'internal',
    icon: 'HeartPulse',
    external_url: null,
    display_order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm4-neurology',
    title: 'Neurology',
    slug: '/services/neurology',
    parent_id: 'm4-services',
    page_id: 'p-neurology',
    menu_type: 'internal',
    icon: 'Activity',
    external_url: null,
    display_order: 2,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm4-orthopaedics',
    title: 'Orthopaedics',
    slug: '/services/orthopaedics',
    parent_id: 'm4-services',
    page_id: 'p-orthopaedics',
    menu_type: 'internal',
    icon: 'Bone',
    external_url: null,
    display_order: 3,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm4-diagnostics',
    title: 'Diagnostics',
    slug: '/services/diagnostics',
    parent_id: 'm4-services',
    page_id: 'p-diagnostics',
    menu_type: 'internal',
    icon: 'Scan',
    external_url: null,
    display_order: 4,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  // 5. Patient Care (Dropdown Parent)
  {
    id: 'm5-patient-care',
    title: 'Patient Care',
    slug: '/patient-care',
    parent_id: null,
    page_id: null,
    menu_type: 'dropdown_parent',
    icon: 'ShieldCheck',
    external_url: null,
    display_order: 5,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm5-patient-info',
    title: 'Patient Information',
    slug: '/patient-care/patient-information',
    parent_id: 'm5-patient-care',
    page_id: 'p-patient-info',
    menu_type: 'internal',
    icon: 'FileText',
    external_url: null,
    display_order: 1,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm5-insurance',
    title: 'Insurance & TPA',
    slug: '/patient-care/insurance',
    parent_id: 'm5-patient-care',
    page_id: 'p-insurance',
    menu_type: 'internal',
    icon: 'Award',
    external_url: null,
    display_order: 2,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm5-packages',
    title: 'Health Packages',
    slug: '/patient-care/health-packages',
    parent_id: 'm5-patient-care',
    page_id: 'p-health-packages',
    menu_type: 'internal',
    icon: 'Sparkles',
    external_url: null,
    display_order: 3,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  // 6. Contact Us
  {
    id: 'm6-contact',
    title: 'Contact Us',
    slug: '/contact',
    parent_id: null,
    page_id: null,
    menu_type: 'internal',
    icon: 'PhoneCall',
    external_url: null,
    display_order: 6,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

function getStoredLocalMenus(): Menu[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MENUS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(DEFAULT_MENUS));
      return DEFAULT_MENUS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MENUS;
  } catch (err) {
    console.warn('Failed to parse local menus, using defaults:', err);
    return DEFAULT_MENUS;
  }
}

function saveLocalMenus(menus: Menu[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(menus));
    notifyMenuUpdate();
  } catch (err) {
    console.error('Failed to save local menus:', err);
  }
}

export function notifyMenuUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rhythm_menus_changed'));
  }
}

/**
 * Builds nested tree from flat list of menus
 */
export function buildMenuTree(flatMenus: Menu[]): Menu[] {
  const map = new Map<string, Menu>();
  const roots: Menu[] = [];

  // Clone items to avoid mutating input
  flatMenus.forEach((m) => {
    map.set(m.id, { ...m, children: [] });
  });

  // Attach children to parents
  flatMenus.forEach((m) => {
    const item = map.get(m.id)!;
    if (m.parent_id && map.has(m.parent_id)) {
      const parent = map.get(m.parent_id)!;
      if (!parent.children) parent.children = [];
      parent.children.push(item);
    } else {
      roots.push(item);
    }
  });

  // Sort by display_order
  roots.sort((a, b) => a.display_order - b.display_order);
  roots.forEach((root) => {
    if (root.children && root.children.length > 0) {
      root.children.sort((a, b) => a.display_order - b.display_order);
    }
  });

  return roots;
}

export const MenuService = {
  /**
   * Get all active menus for public website navigation as nested tree
   */
  async getPublicMenus(): Promise<Menu[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return buildMenuTree(data as Menu[]);
        }
      } catch (err) {
        console.warn('Supabase menu fetch fallback to local:', err);
      }
    }

    const local = getStoredLocalMenus().filter((m) => m.is_active);
    return buildMenuTree(local);
  },

  /**
   * Get all menus for Admin Management (includes inactive & flat)
   */
  async getAllMenusAdmin(): Promise<Menu[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as Menu[];
        }
      } catch (err) {
        console.warn('Supabase admin menus fetch fallback to local:', err);
      }
    }

    return getStoredLocalMenus();
  },

  /**
   * Create a new menu item
   */
  async createMenu(menuData: Partial<Menu>): Promise<Menu> {
    const now = new Date().toISOString();
    const newMenu: Menu = {
      id: generateUUID(),
      title: menuData.title || 'New Menu',
      slug: menuData.slug || '/',
      parent_id: menuData.parent_id || null,
      page_id: menuData.page_id || null,
      menu_type: menuData.menu_type || (menuData.parent_id ? 'internal' : 'dropdown_parent'),
      icon: menuData.icon || null,
      external_url: menuData.external_url || null,
      display_order: menuData.display_order ?? 99,
      is_active: menuData.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('menus')
          .insert([newMenu])
          .select()
          .single();

        if (!error && data) {
          notifyMenuUpdate();
          return data as Menu;
        }
      } catch (err) {
        console.warn('Supabase createMenu error, saving to local fallback:', err);
      }
    }

    const current = getStoredLocalMenus();
    const updated = [...current, newMenu];
    saveLocalMenus(updated);
    return newMenu;
  },

  /**
   * Update an existing menu item
   */
  async updateMenu(id: string, updates: Partial<Menu>): Promise<Menu> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('menus')
          .update({ ...updates, updated_at: now })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          notifyMenuUpdate();
          return data as Menu;
        }
      } catch (err) {
        console.warn('Supabase updateMenu error, updating local:', err);
      }
    }

    const current = getStoredLocalMenus();
    const index = current.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Menu item not found');

    const updatedItem = {
      ...current[index],
      ...updates,
      updated_at: now,
    };
    current[index] = updatedItem;
    saveLocalMenus(current);
    return updatedItem;
  },

  /**
   * Delete a menu item and its descendants
   */
  async deleteMenu(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('menus').delete().eq('id', id);
        notifyMenuUpdate();
        return;
      } catch (err) {
        console.warn('Supabase deleteMenu error, deleting local:', err);
      }
    }

    const current = getStoredLocalMenus();
    // Recursively collect all descendant IDs
    const toDelete = new Set<string>([id]);
    let added = true;
    while (added) {
      added = false;
      current.forEach((m) => {
        if (m.parent_id && toDelete.has(m.parent_id) && !toDelete.has(m.id)) {
          toDelete.add(m.id);
          added = true;
        }
      });
    }

    const filtered = current.filter((m) => !toDelete.has(m.id));
    saveLocalMenus(filtered);
  },

  /**
   * Reorder menu items
   */
  async reorderMenus(items: { id: string; display_order: number }[]): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        for (const item of items) {
          await supabase
            .from('menus')
            .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
            .eq('id', item.id);
        }
        notifyMenuUpdate();
        return;
      } catch (err) {
        console.warn('Supabase reorderMenus error, updating local:', err);
      }
    }

    const current = getStoredLocalMenus();
    const orderMap = new Map(items.map((i) => [i.id, i.display_order]));
    const updated = current.map((m) => {
      if (orderMap.has(m.id)) {
        return { ...m, display_order: orderMap.get(m.id)! };
      }
      return m;
    });

    saveLocalMenus(updated);
  },

  /**
   * Toggle Active / Inactive status
   */
  async toggleMenuStatus(id: string, is_active: boolean): Promise<Menu> {
    return this.updateMenu(id, { is_active });
  },

  /**
   * Reset menus to default template
   */
  async resetToDefaults(): Promise<Menu[]> {
    saveLocalMenus(DEFAULT_MENUS);
    return DEFAULT_MENUS;
  },
};

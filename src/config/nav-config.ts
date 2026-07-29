import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: '概览',
    items: [
      {
        title: '仪表盘',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
    ]
  },
  {
    label: '知识库',
    items: [
      {
        title: '知识库管理',
        url: '/dashboard/knowledge',
        icon: 'workspace',
        isActive: false,
        shortcut: ['k', 'k'],
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '账户',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: '个人资料',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          },
          {
            title: '退出登录',
            shortcut: ['l', 'l'],
            url: '/',
            icon: 'login'
          }
        ]
      }
    ]
  }
];

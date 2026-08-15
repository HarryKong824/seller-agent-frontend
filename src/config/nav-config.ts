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
      },
      {
        title: '知识沉淀',
        url: '/dashboard/knowledge-cards',
        icon: 'book',
        isActive: false,
        shortcut: ['b', 'b'],
        items: []
      },
      {
        title: '每日报表',
        url: '/dashboard/daily-reports',
        icon: 'report',
        isActive: false,
        shortcut: ['r', 'r'],
        items: []
      }
    ]
  },
  {
    label: '对话',
    items: [
      {
        title: 'AI 对话',
        url: '/dashboard/chat',
        icon: 'chat',
        isActive: false,
        shortcut: ['c', 'c'],
        items: []
      }
    ]
  },
  {
    label: '销售',
    items: [
      {
        title: '拜访打卡',
        url: '/dashboard/visits',
        icon: 'mapPin',
        isActive: false,
        shortcut: ['v', 'v'],
        items: []
      },
      {
        title: 'Playbook 模板库',
        url: '/dashboard/playbook',
        icon: 'forms',
        isActive: false,
        shortcut: ['p', 'p'],
        items: []
      },
      {
        title: '线索管理',
        url: '/dashboard/leads',
        icon: 'user2',
        isActive: false,
        shortcut: ['l', 'l'],
        items: []
      }
    ]
  },
  {
    label: '管理',
    items: [
      {
        title: '用户管理',
        url: '/dashboard/users',
        icon: 'user',
        isActive: false,
        shortcut: ['u', 'u'],
        items: []
      },
      {
        title: '团队报表',
        url: '/dashboard/reports',
        icon: 'report',
        isActive: false,
        items: []
      },
      {
        title: '管理建议',
        url: '/dashboard/insights',
        icon: 'sparkles',
        isActive: false,
        items: []
      },
      {
        title: '目标管理',
        url: '/dashboard/targets',
        icon: 'badgeCheck',
        isActive: false,
        items: []
      },
      {
        title: '目标完成率',
        url: '/dashboard/targets/completion',
        icon: 'trendingUp',
        isActive: false,
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

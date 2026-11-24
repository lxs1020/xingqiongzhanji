export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/feed/index',
    'pages/mine/index',
    'pages/detail/index',
    'pages/add/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '包裹管家',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f4f6fa'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#2f6bff',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '包裹',
        iconPath: 'assets/tabbar/box.svg',
        selectedIconPath: 'assets/tabbar/box-selected.svg'
      },
      {
        pagePath: 'pages/feed/index',
        text: '动态',
        iconPath: 'assets/tabbar/feed.svg',
        selectedIconPath: 'assets/tabbar/feed-selected.svg'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.svg',
        selectedIconPath: 'assets/tabbar/mine-selected.svg'
      }
    ]
  }
})

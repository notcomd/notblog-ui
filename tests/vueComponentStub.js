// .vue 组件替身：路由/守卫类测试只关心路由表与导航结果，不渲染组件。
// 用它替换真实组件，可避免为一次路由断言去转译整棵组件树（会连带引入 cropperjs、animejs 等）。
module.exports = { name: 'StubComponent', render: () => null }

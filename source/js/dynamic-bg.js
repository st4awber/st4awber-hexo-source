// 根据当前路径设置背景图
(function() {
    var isHome = window.location.pathname === '/' || window.location.pathname === '/index.html';
    var bgUrl = isHome ? '/img/bg.avif' : '/img/bgdefault.avif';
    document.body.style.backgroundImage = 'url(' + bgUrl + ')';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'scroll'; // 随滚动，不固定
    document.body.style.backgroundRepeat = 'no-repeat';
})();
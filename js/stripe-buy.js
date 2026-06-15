// Hides .stripe-buy-btn on product pages whose product has canbuy:false or no stripeUrl in products.json.
// Default-visible: if products.json fails to load, the hardcoded button still works (graceful degradation).
(function () {
    var btns = document.querySelectorAll('.stripe-buy-btn');
    if (!btns.length) return;
    fetch('products.json').then(function (r) { return r.json(); }).then(function (products) {
        var here = (location.pathname.split('/').pop() || '').toLowerCase();
        var p = products.find(function (x) { return x.link && x.link.toLowerCase() === here; });
        var active = p && p.canbuy && p.stripeUrl && p.stripeUrl.indexOf('https://') === 0;
        btns.forEach(function (btn) {
            if (!active) {
                btn.style.display = 'none';
            } else {
                btn.href = p.stripeUrl;
            }
        });
    }).catch(function () {});
})();

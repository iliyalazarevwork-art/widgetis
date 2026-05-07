// source: https://medovemisto.com/
// extracted: 2026-05-07T21:19:11.648Z
// scripts: 1

// === script #1 (length=639) ===
if ($('div[itemtype="https://schema.org/FAQPage"]').length > 0) {
    $('div[itemtype="https://schema.org/FAQPage"] div').each(function(){
        $(this).addClass('closed');
    });
    $('div[itemtype="https://schema.org/FAQPage"] div').first().removeClass('closed');
}

$('div[itemtype="https://schema.org/FAQPage"] h3[itemprop="name"]').on('click', function(e){
    e.preventDefault();
    $(this).parent().toggleClass('closed');
    return false;
});

if ($('.labeled').length) {
$('.labeled').each(function(){
let label = $(this).find('img').attr('alt');
$(this).append("<span class='label'>"+label+"</span>");
})
}

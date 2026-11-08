(function(){
document.querySelectorAll('.services-dropdown').forEach(function(menu){
const trigger=menu.querySelector('summary');if(!trigger)return;
menu.addEventListener('mouseenter',function(){if(window.matchMedia('(hover:hover) and (pointer:fine)').matches)menu.open=true});
menu.addEventListener('mouseleave',function(){if(window.matchMedia('(hover:hover) and (pointer:fine)').matches)menu.open=false});
document.addEventListener('click',function(e){if(!menu.contains(e.target))menu.open=false});
menu.addEventListener('keydown',function(e){if(e.key==='Escape'){menu.open=false;trigger.focus()}});
});
})();
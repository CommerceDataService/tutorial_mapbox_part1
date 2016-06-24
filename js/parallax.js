//Parallax -- COVER
function simpleParallax() {
    //This variable is storing the distance scrolled
    var scrolled = $(window).scrollTop() + 1;

    //Every element with the class "scroll" will have parallax background 
    //Change the "0.3" for adjusting scroll speed.
<<<<<<< HEAD
    $('.scroll').css('background-position', '0' + -(scrolled * 0.9) + 'px');
=======
    $('.scroll').css('background-position', '0' + -(scrolled * 0.1) + 'px');
>>>>>>> fc9a4a941de91ed88ddd53b5e76690fd320438cb
}
//Everytime we scroll, it will fire the function
$(window).scroll(function (e) {
    simpleParallax();
});

//Parallax 
function simpleParallax2() {
    //This variable is storing the distance scrolled
    var scrolled = $(window).scrollTop() + 1;

    //Every element with the class "scroll" will have parallax background 
    //Change the "0.3" for adjusting scroll speed.
<<<<<<< HEAD
    $('.scroll2').css('background-position', '0' + -(scrolled * 0.8) + 'px');
=======
    $('.scroll2').css('background-position', '0' + -(scrolled * 0.5) + 'px');
>>>>>>> fc9a4a941de91ed88ddd53b5e76690fd320438cb
}
//Everytime we scroll, it will fire the function
$(window).scroll(function (e) {
    simpleParallax2();
});
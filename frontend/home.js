$(document).ready(function(){
    $("#trail-info-btn").click(function(){
        $("#open-list").empty();
        $("#closed-list").empty();
        $("#groomed-list").empty();
        $("#hold-list").empty();
        $("#open-lift").empty();
        // $("#closed-lift").empty();
        jQuery.get('/jay', function(data, status){
            if(status === "success"){
                const {openTrails, closedTrails, groomedTrails, holdLift, openLift} = data;
                for(let i = 0; i < openTrails.length; i++){
                    $("#open-list").append($("<li>").text(openTrails[i]));
                }
                for(let i = 0; i < closedTrails.length; i++){
                    $("#closed-list").append($("<li>").text(closedTrails[i]));
                }
                for(let i = 0; i < groomedTrails.length; i++){
                    $("#groomed-list").append($("<li>").text(groomedTrails[i]));
                }
                for(let i = 0; i < holdLift.length; i++){
                    $("#hold-list").append($("<li>").text(holdLift[i]));
                }
                for(let i = 0; i < openLift.length; i++){
                    $("#open-lift").append($("<li>").text(openLift[i]));
                }
                // for(let i = 0; i < closedLift.length; i++){
                //     $("#closed-lift").append($("<li>").text(closedLift[i]));
                // }
            }
        })
    })
})
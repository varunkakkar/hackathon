# API


## Set the base api url for ease of use


    var API_BASE_URL = "http://178.79.174.128/";


## PUBLISH entry to api


    $.ajax({
        type : "POST",
        url  : API_BASE_URL + "entries/add",
        data : {
            email       : "",
            name        : "", // optional
            description : "",
            data        : {
                // json to serialize
            }
        },
        dataType   : "json",
        statusCode : {
            201: function(data) {
                var entry_id = data.id;

                // use entry_id in the get url below
            },
            400: function(data) {
                // some validation error
                // data is an array of error messages
                alert(data.join(", "));
            }
        }
    });


## RETRIEVE entry from api


    $.ajax({
        type       : "GET",
        url        : API_BASE_URL + "entries/get" + entry_id,
        dataType   : "json",
        statusCode : {
            200: function(entry) {
                console.log(entry);

                // you might have to eval() entry.data
                var unserialized_data = eval(entry.data());
            },
            404: function() {
                // entry not found
            }
        }
    });


## VOTE on an entry


    $.ajax({
        type : "POST",
        url  : API_BASE_URL + "votes/vote",
        data : {
            email    : "",
            entry_id : entry_id,
            like     : // 1 for like, 0 for dislike,
        },
        dataType   : "json",
        statusCode : {
            201: function(data) {
                console.log(data);
                // you will get stats about likes, dislikes and total votes
            },
            400: function(data) {
                // some validation error
                // data is an array of error messages
                alert(data.join(", "));
            }
        }
    });


## Get votes data for entry


    $.ajax({
        type : "GET",
        url  : API_BASE_URL + "votes/get/" + entry_id,
        dataType   : "json",
        statusCode : {
            200: function(data) {
                console.log(data);
                // you will get stats about likes, dislikes and total votes
            },
            404: function() {
                // entry not found
            }
        }
    });


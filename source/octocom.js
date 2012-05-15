(function(root) {

    var url = 'https://api.github.com/repos/jamuhl/octoviz/commits?sha=master';

    $.getJSON(url, function(data) {
        console.log(data);
    });    

}(window));
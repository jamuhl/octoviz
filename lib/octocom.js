(function(root) {

    var url = 'https://api.github.com/repos/jamuhl/octoviz/commits?sha=master';

    function getCommitDetail(data) {
        _,each(data, function(commit, index, list) {
            $.getJSON(commit.url, function(data) {
                list[index] = data;
            });    
        });
        console.log(data);
    }

    $.getJSON(url, function(data) {
       getCommitDetail(data);
    });    

}(window));
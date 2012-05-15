(function(root) {

    var url = 'https://api.github.com/repos/jamuhl/octoviz/commits?sha=master';

    function getCommitDetails(commits, callback) {
        var todo = commits.length;
        _.each(commits, function(commit, index, list) {
            $.getJSON(commit.url, function(detail) {
                todo--;
                list[index] = detail;

                if (!todo) callback(list);
            });    
        });
    }

    function loadCommitHistory(url, callback) {
        $.getJSON(url, function(commits) {
            getCommitDetails(commits, function(list) {
                callback(list);
            });
        });
    }

    function flattenToFiles(commits, callback) {
        var files = {}
            arr = [];

        for (var i = commits.length - 1; i >= 0; i--) {
            var commit = commits[i];

            _.each(commit.files, function(file) {
                var t;
                if (!files[file.filename]) {
                    files[file.filename] = {};
                    t = files[file.filename];
                    arr.push(t);
                } else {
                    t = files[file.filename];
                }

                t.size = (t.size || 0) + (file.additions || 0) + (files.deletions || 0);
                t.x = 0;
                t.y = 0;
                t.id = file.filename;
            });
        }
        callback({ children: arr, x: 0, y: 0 });
    }

    function loadFiles(callback) {
        loadCommitHistory(url, function(commits) {
            flattenToFiles(commits, function(files) {
                console.log(files);
                callback(files);
            });
        });
    }

    root.octocom = {
        load: loadFiles
    };

}(window));
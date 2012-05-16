(function(root) {

    //var url = 'https://api.github.com/repos/jamuhl/nodeEventStore/commits?sha=master';
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

    function extendTree(root, path) {

        var parts = path.split('/'),  
            parent = root,  
            pl, i;  

        pl = parts.length;
        for (i = 0; i < pl; i++) {
            var found = _.find(parent.children, function(file) {
                return file.id === parts[i];
            });

            if (!found) {  
                found = (i === pl -1) ? { id: path, name: parts[i]} : { id: parts[i], name: parts[i], children: [] };  
                parent.children.push(found);
            }  
            parent = found;
        }

        return parent;  
    }

    function commitsToFiles(commits, callback) {
        var root = {
            id: 'root',
            name: 'root',
            children: []
        };

        var files = {}
          ,  arr = [];

        for (var i = commits.length - 1; i >= 0; i--) {
            var commit = commits[i];

            _.each(commit.files, function(file) {
                var t = extendTree(root, file.filename);

                t.size = (t.size || 0) + (file.additions || 0) + (files.deletions || 0);
            });
        }
        callback(root);
    }

    function loadFiles(callback) {
        loadCommitHistory(url, function(commits) {
            commitsToFiles(commits, function(files) {
                callback(files);
            });
        });
    }

    root.octocom = {
        load: loadFiles
    };

}(window));
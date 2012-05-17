(function(window) {

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

    function hashCode(str) { // java String#hashCode
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
           hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    } 

    function intToARGB(i){
        return ((i>>24)&0xFF).toString(16) + 
               ((i>>16)&0xFF).toString(16) + 
               ((i>>8)&0xFF).toString(16) + 
               (i&0xFF).toString(16);
    }

    function extendTree(root, path) {

        var parts = path.split('/'),  
            parent = root,  
            pl, i;  

        pl = parts.length;
        for (i = 0; i < pl; i++) {
            var found = _.find(parent.children, function(file) {
                return file.id === parts[i] || file.id === path;
            });

            if (!found) {  
                found = (i === pl -1) ? { id: path, name: parts[i]} : { id: parts[i], name: parts[i], children: [] };  
                parent.children.push(found);
            }  
            parent = found;
        }

        return parent;  
    }

    function commitsToFiles(name, commits, callback) {
        var history = [{
            id: 'root',
            name: name,
            children: []
        }];

        var z = 0;
        for (var i = commits.length - 1; i >= 0; i--) {
            if (z > 0) history[z] = jQuery.extend(true, {}, history[z - 1]);
            var commit = commits[i];
            var contributorColor = intToARGB(hashCode(commit.commit.committer.name));
            contributorColor = '#' + contributorColor.substring(0, 6);

            _.each(commit.files, function(file) {
                var t = extendTree(history[z], file.filename);

                t.size = (t.size || 0) + (file.additions || 0) + (file.deletions || 0);
                t.status = file.status;
                t.color = contributorColor;
            });
            z++;
        }
        callback(history);
    }

    function loadFiles(repo, branch, callback) {
        var url = 'https://api.github.com/repos/' + repo + '/commits?sha=' + branch;
        loadCommitHistory(url, function(commits) {
            commitsToFiles(repo + ':' + branch,commits, function(files) {
                callback(files);
            });
        });
    }

    window.octocom = {
        load: loadFiles
    };

}(this));
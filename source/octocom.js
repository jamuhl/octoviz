(function(window) {

    function getCommitDetails(commits, callback) {
        var todo = commits.length;
        _.each(commits, function(commit, index, list) { console.log(commit.url);
            $.getJSON(commit.url + '?callback=?', function(ret) {
                todo--;
                list[index] = ret.data;

                if (!todo) callback(list);
            });    
        });
    }

    function loadCommitHistory(url, callback) {
        $.getJSON(url + '&callback=?', function(ret) {
            getCommitDetails(ret.data, function(list) {
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
            contributors: [],
            children: []
        }];

        var z = 0;
        for (var i = commits.length - 1; i >= 0; i--) {
            if (z > 0) history[z] = jQuery.extend(true, {}, history[z - 1]);
            
            var root = history[z]
              , commit = commits[i]
              , committer = { name: commit.commit.committer.name };

            // add commit infos
            root.commitMsg = commit.commit.message;

            var contributor = _.find(root.contributors, function(contr) {
                return contr.name === committer.name;
            });

            if (!contributor) {
                contributor = committer;

                // calculate committer color
                var contributorColor = intToARGB(hashCode(contributor.name));
                contributor.color = '#' + contributorColor.substring(0, 6);

                root.contributors.push(contributor);
            }

            // append files as hierarchy
            _.each(commit.files, function(file) {
                var t = extendTree(history[z], file.filename);

                t.size = (t.size || 0) + (file.additions || 0) + (file.deletions || 0);
                t.status = file.status;
                t.color = contributor.color;
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
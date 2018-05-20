console.log('Background running');
let stored_data = null;

window.onload = function () {
    chrome.storage.onChanged.addListener(function (changes, type) {
        if (type == "sync")
            window.location.reload();
    });
    chrome.storage.sync.get(null, function (obj) {
        console.log(obj);
        stored_data = obj;
        add_pending_problems();
        add_solved_problems();
    });
    document.getElementById("clear_stats").addEventListener("click", clear_stats);
};

function add_pending_problems() {
    let pending_p = document.getElementById('pending');
    if (!stored_data.added_links || stored_data.added_links.length == 0) {
        let t = document.createTextNode("No pending problems :)");
        pending_p.appendChild(t);
    }
    else {
        let ul_added = document.createElement("ul");
        pending_p.appendChild(ul_added);

        for (link of stored_data.added_links) {
            let txt = document.createTextNode(link);
            let urltxt = document.createElement('a');
            urltxt.setAttribute('href', link);
            urltxt.setAttribute('target', '_blank');
            urltxt.appendChild(txt);
            let li = document.createElement('li');
            li.appendChild(urltxt);
            let info = stored_data[link];
            $(li).append('<br/>' + '<b>Added on</b> : ' + info["time_added"]);
            let tagstring = extract_tagstring(info)
            $(li).append('<br/><b>Tags</b> : ' + tagstring);
            ul_added.appendChild(li);
        }
    }
}

function add_solved_problems() {
    let solved_p = document.getElementById('solved');
    if (!stored_data.solved_links || stored_data.solved_links.length == 0) {
        let t = document.createTextNode("You haven't solved any problems yet!");
        solved_p.appendChild(t);
    }
    else {
        let ul_added = document.createElement("ul");
        solved_p.appendChild(ul_added);

        for (link of stored_data.solved_links) {
            let txt = document.createTextNode(link);
            let urltxt = document.createElement('a');
            urltxt.setAttribute('href', link);
            urltxt.setAttribute('target', '_blank');
            urltxt.appendChild(txt);
            let li = document.createElement('li');
            li.appendChild(urltxt);
            let info = stored_data[link];
            $(li).append('<br/>' + '<b>Solved on</b> : ' + info["time_solved"]);
            let tagstring = extract_tagstring(info)
            $(li).append('<br/><b>Tags</b> : ' + tagstring);
            ul_added.appendChild(li);
        }
    }
}

function extract_tagstring(info) {
    let tagstring = '';
    if (!info.tags || info.tags.length == 0)
        tagstring += 'None';
    else {
        tagstring += info.tags[0];
        for (let i = 1; i < info.tags.length; i++) {
            tagstring += ', ' + info.tags[i];
        }
    }
    return tagstring;
}

function clear_stats() {
    chrome.storage.sync.clear();
}
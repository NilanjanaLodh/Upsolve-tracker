let current_tab = null;
let added_links = [];
let solved_links = [];
let current_tab_status = 'NA';
/**
 * possible statuses 
 * NA : Never added
 * PENDING : Pending, it's been added
 * SOLVED : It's been Solved before
 */


window.onload = function () {
    initialize();
    console.log('popup opened! ');
    console.log(new Date().toLocaleString());

    //add all event listeners
    document.getElementById("add_link").addEventListener("click", add_link_handler);
    document.getElementById("remove_link").addEventListener("click", remove_link_handler);
    document.getElementById("mark_solved").addEventListener("click", mark_solved_handler);
    document.getElementById("show_saved").addEventListener("click", show_saved_handler);
};


// initial setup
function initialize() {
    console.log('Before  : ' + new Date().toLocaleString());
    //chrome storage set up
    chrome.storage.sync.get(null, function (obj) {
        var prev_added_links = obj.added_links;
        var prev_solved_links = obj.solved_links;
        var query = { active: true, currentWindow: true };
        chrome.tabs.query(query, function (tabs) {
            current_tab = tabs[0];
            if (!prev_added_links) {
                chrome.storage.sync.set({ 'added_links': [] }, function () {
                    console.log('set up \'added_links\' for the first time!');
                });
            }
            else {
                //previous added_links have to be used
                added_links = prev_added_links;
                tmp_added_urls = added_links.map(link => link.url);
                if (tmp_added_urls.indexOf(current_tab.url) != -1)
                    current_tab_status = 'PENDING';
            }
            if (!prev_solved_links) {
                chrome.storage.sync.set({ 'solved_links': [] }, function () {
                    console.log('set up \'solved_links\' for the first time!');
                });
            }
            else {
                //previous solved_links have to be used
                solved_links = prev_solved_links;
                if (current_tab_status == 'NA') {
                    tmp_solved_urls = solved_links.map(link => link.url);
                    if (tmp_solved_urls.indexOf(current_tab.url) != -1)
                        current_tab_status = 'SOLVED';
                }
            }
        });

    });
}


function add_link_handler() {
    if (current_tab_status == 'PENDING') {
        alert('Problem is already saved!');
    }
    else if (current_tab_status == 'SOLVED')
        alert('You have solved this problem before!');
    else {
        let latest = {
            'url': current_tab.url,
            'time': new Date()
        };
        current_tab_status = 'PENDING';
        added_links.push(latest);
        console.log(added_links);
        chrome.storage.sync.set({ 'added_links': added_links }, function () {
            console.log('saved!');
            alert(current_tab.url + ' saved!');
        });
    }
}

function remove_link_handler() {
    if (current_tab_status == 'NA') {
        alert('Problem is not in your todo list!');
    }
    else if (current_tab_status == 'SOLVED')
        alert('You have solved this problem before!');
    else {
        added_links = added_links.filter(link => (link.url != current_tab.url));
        current_tab_status = 'NA';
        console.log(added_links);
        chrome.storage.sync.set({ 'added_links': added_links }, function () {
            console.log('removed!');
            alert(current_tab.url + ' removed!');
        });
    }
}

function mark_solved_handler() {
    if (current_tab_status == 'SOLVED') {
        alert('You have solved this problem before!');
    }
    else {
        if (current_tab_status == 'PENDING') {
            //first remove it from added_links
            added_links = added_links.filter(link => (link.url != current_tab.url));
            console.log(added_links);
            chrome.storage.sync.set({ 'added_links': added_links }, function () {
                console.log('removed from added_links!');
            });
        }
        let latest = {
            'url': current_tab.url,
            'time': new Date()
        };
        solved_links.push(latest);
        current_tab_status = 'SOLVED';
        console.log(solved_links);
        chrome.storage.sync.set({ 'solved_links': solved_links }, function () {
            console.log('marked as solved!');
            alert(current_tab.url + ' marked as solved!');
        });
    }
}


function show_saved_handler() {
    chrome.storage.sync.get(null,
        function (obj) {
            console.log(obj);
        }
    );
    chrome.tabs.create({ 'url': chrome.extension.getURL('upsolve-tracker-stats.html') }, function (tab) {
        console.log(tab);
    });
}
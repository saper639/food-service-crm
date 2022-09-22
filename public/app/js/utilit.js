DEF.currencies.p = function(val) {
    return val.format(0) + ' P';
};
/*spin*/
function spin(value, path, e) {
        $(e).attrd('loading-text', "<i class='fa fa-spinner fa-spin'></i> Wait...");
};
/*gp - for table filter*/
function gp(obj) {
        var new_obj = {};
        
        for (item in obj) {
                if (item=='filter') {
                     for (const [key, value] of Object.entries(obj[item])) {
                        new_obj['filter_'+key] = value;
                     }
                }        
                if (item=='period' && Array.isArray(obj[item])) {
                        new_obj[item+'_fd'] = new Date(obj[item][0]).format('yyyy-MM-dd hh:mm:ss');
                        new_obj[item+'_td'] = new Date(obj[item][1]).format('yyyy-MM-dd hh:mm:ss');
                } else if (Array.isArray(obj[item])) {
                        obj[item].forEach((val, index)=> new_obj[item+'_'+index] = val);
                } else new_obj[item] = obj[item];
        }                                                                                                                                                                                             
        return new_obj;                                                                                                                                                                               
} 
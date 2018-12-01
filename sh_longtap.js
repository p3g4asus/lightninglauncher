var item = getEvent().getItem();
var tag = JSON.parse(item.getTag("ep"));
var adds = "";
if (!tag.st)
    adds = "Mai visto";
else
    adds = "Visto "+(new Date(tag.st).toLocaleString("it-IT",
    {
         weekday: 'narrow', year: 'numeric', month: 'narrow', day: 'numeric'
    }));
alert(tag.k+") "+tag.kk+"\n"+tag.kkk+"\nDurata: "+tag.dur+"m\n\n"+adds);

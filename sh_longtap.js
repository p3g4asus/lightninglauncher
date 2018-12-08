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
var kkk = tag.kkk?"\n"+tag.kkk:"";
var dur = tag.dur?"\nDurata: "+tag.dur+"m":"";
alert(tag.k+") "+tag.kk+kkk+dur+"\n\n"+adds);

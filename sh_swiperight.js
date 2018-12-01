var item = getEvent().getItem();
var tag = JSON.parse(item.getTag("ep"));
tag.st = 0;
item.setTag("ep",JSON.stringify(tag));
var ed = item.getProperties().edit();
ed.setInteger("s.labelFontColor", Color.WHITE);
ed.commit();

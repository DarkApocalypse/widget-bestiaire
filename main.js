window.BESTIAIRE = (function(){
		/* URL à modifier pour cibler le topic contenant les monstres */
		var URL_BESTIAIRE = "/t2-bestiaire-du-monde";
		/* Sélecteur css pour récupérer le nombre de page dans le topic */
		var SELECTOR_NBSPAGES = ".pagination:first strong:nth(1)"
		/* Sélecteur css pour récupérer la div du bestiaire */
		var SELECTOR_BOOK = ".widget-bestiaire .book";
		/* Attribut des monstres:
			id => identifiant unique de la liste(uniquement des lettres, des chiffres, "_", et "-" sans les "
			
			displayName => Nom de l'attribut à afficher
			
			type => type d'attribut(détermine comment l'attribut est affiché)
				INT => entier
				IMG => image via une url
				URL => Lien URL externe
				SHORTTEXT => Texte sur une ligne
				TEXT => Texte HTML
				LIST => liste d'élément
				
			visibleWidget => détermine si l'attribut est affiché dans le widget(true = oui, false = non)
			
			default => correspond à la valeur par défaut lors de la création d'un monstre
		*/
		var FIELDS = [
			{"id": "NAME", "displayName": "Nom", "type":"SHORTTEXT", "visibleWidget": true, "default": ""},
			{"id": "IMG", "displayName": "Illustation", "type":"IMG", "visibleWidget": true, "default": "https://illiweb.com/fa/icon_mini_search.gif"},
			{"id": "PV", "displayName": "Point de vie",  "type":"INT", "visibleWidget": true, "default": 0},
			{"id": "TEXT", "displayName": "Description", "type":"TEXT", "visibleWidget": true, "default": ""},
			{"id": "DROP", "displayName": "Objets en sa possession", "type":"LIST", "visibleWidget": false, "default": []},
	 	];
		/* NE PAS MODIFIER LA SUITE */
		var ctx = {
			"nbsPages": 0,
			"pageActuelle": 0,
			"mobs": []
		};
		function buildBook(mobs, callback){
			console.log("building book with ", mobs.length); 
			var book = jQuery(document).find(SELECTOR_BOOK);
			book.attr("data-mobs", JSON.stringify(mobs));
			book.empty();
			for(var i=0; i < mobs.length;i++){
				var page = jQuery("<div />");
				page.attr("id", "page-" + i);
				page.addClass("page");
				if(i==0)
					page.addClass("current")
				var ta = jQuery("<table />");
				var tr,td, img, a, ul, li;
				for(var j=0; j < FIELDS.length; j++){
					tr = jQuery("<tr />");
					td = jQuery("<th />");
					td.text(FIELDS[j].displayName);
					tr.append(td)
					td = jQuery("<td />");
					if(FIELDS[j].type=="INT"){
						td.text(mobs[i][FIELDS[j].id]);
					}
					else if(FIELDS[j].type=="IMG"){
						img = jQuery("<img />");
						img.attr("src", mobs[i][FIELDS[j].id]);
						td.append(img);
					}
					else if(FIELDS[j].type=="URL"){
						a = jQuery("<a />");
						a.attr("src", mobs[i][FIELDS[j].id]);
						a.html("Lien externe");
						td.append(a);
					}
					else if(FIELDS[j].type=="TEXT" || FIELDS[j].type=="SHORTTEXT"){
						td.html(mobs[i][FIELDS[j].id]);
					}
					else if(FIELDS[j].type=="LIST"){
						ul = jQuery("<ul />");
						var ops = mobs[i][FIELDS[j].id];
						for(var k=0; k < ops.length; k++){
							li=jQuery("<li>");
							li.html(ops[k]);
							ul.append(li);
						}
						td.append(ul);
					}
					tr.append(td)					
					ta.append(tr);
				}
				
				page.append(ta);
				book.append(page);
			}
			callback();
		}
		function getNbsPages(callback){
			jQuery.ajax({
				url: URL_BESTIAIRE.replace("PAGE", ""),
				success:function(page){
					page = jQuery(page);
					ctx.nbsPages = parseInt(page.find(SELECTOR_NBSPAGES).text());
					window.BESTIAIRE_AUTH = page.find("#quick_reply").find("input[name]");
					callback();
				}
			});
		}
		function getMobsOnPage(pageNbr, callback){
			//on récupère la page avec les fiches des monstres
			jQuery.ajax({
				url: URL_BESTIAIRE.replace("PAGE", pageNbr),
				success:function(page){
					var doc = jQuery(page);
					var html_mobs = doc.find(".bestiaire-mob");
					console.log(html_mobs.length + " mobs trouvés!");
					//on parcoure les fiches des monstres présentes sur cette page
					for(var i=0;i < html_mobs.length; i++){
						var mob = {}, temp, good = true;
						//on parcoure les attributes des monstres
						for(var j=0;j < FIELDS.length; j++){
							var classname = ".mob_" + FIELDS[j].id;
							temp = jQuery(html_mobs[i]).find(classname);
							if(temp.length==0){
								window.ApocalypseLinux = jQuery(html_mobs[i]);
								console.log("Element non trouvé:", classname, jQuery(html_mobs[i]))
								good = false;
								break;
							}
							if(FIELDS[j].type=="INT"){
								temp = temp.text().match(/[0-9]/);
								if(!temp)
								{
									good = false;
									break;
								}
								mob[FIELDS[j].id] = parseInt(temp[0]);
							}
							else if(FIELDS[j].type=="IMG"){
								temp = temp.find("img").attr("src");
								if(temp.length==0)
								{
									good = false;
									break;
								}
								mob[FIELDS[j].id] = temp;
							}
							else if(FIELDS[j].type=="URL"){
								temp = temp.find("a").attr("src");
								if(temp.length==0)
								{
									good = false;
									break;
								}
								mob[FIELDS[j].id] = temp;
							}
							else if(FIELDS[j].type=="TEXT" || FIELDS[j].type=="SHORTTEXT"){
								console.log("Element trouvé:", temp, temp.html());
								temp = temp.html().trim();
								if(temp.length==0)
								{
									good = false;
									break;
								}
								mob[FIELDS[j].id] = temp;
							}
							else if(FIELDS[j].type=="LIST"){
								temp = temp.find("ul:first li");
								if(temp.length==0){
									good = false;
									break;
								}
								mob[FIELDS[j].id] = [];
								for(var k = 0; k < temp.length; k++)
								{
									mob[FIELDS[j].id].push(jQuery(temp[k]).html().trim());
								}
							}
						}
						//si la fiche du monstre est mal remplie, on ne le retient pas
						if(!good)	
							continue;
							
						ctx.mobs.push(mob);
					}
					ctx.pageActuelle++;
					callback();
				}
			});
		}
		function bookGoToPage(nbPage){}
		jQuery(document).ready(function(){
			getNbsPages(function(){
				console.log("ctx:", ctx);
				var progress = function(){}
				progress = function(){
					console.log("Checking Progression...(", ctx.pageActuelle, "/", ctx.nbsPages,")");
					if(ctx.pageActuelle >= ctx.nbsPages){
						console.log("build Book with ", ctx.mobs.length, "mobs");
						buildBook(ctx.mobs, function(){
							console.log("Book builded");
						});
						return;
					}
					console.log("load mob from page ", ctx.pageActuelle, "/", ctx.nbsPages);
					getMobsOnPage(ctx.pageActuelle, progress);
				};
				progress();
			});
		});
		window.URL_BESTIAIRE = URL_BESTIAIRE;
		window.FIELDS = FIELDS;
	})();

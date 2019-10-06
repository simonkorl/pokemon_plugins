//=============================================================================
 /*:
 * @plugindesc v1.00; This plugin provides the ability to catch enemies. See help for more information.
 * @author MC, FlipelyFlip
 * 
 * @param Base Catch Rate
 * @desc Base Catch Rate is used, when an enemy has no Catch Rate assigned. Default: 45
 * @default 45
 *
 * @param Caught Text
 * @desc Text, which will be shown, when an enemy is caught. %1 = Enemy Name
 * @default Gotcha! %1 was caught.
 *
 * @param Shakes0 Text
 * @desc Text, which will be shown, when an enemy is not caught. %1 = Enemy Name
 * @default No! %1 gets out of the ball!
 *
 * @param Shakes1 Text
 * @desc Text, which will be shown, when an enemy is missed. %1 = Enemy Name
 * @default We are going to make it!
 * 
 * @param Shakes3 Text
 * @desc Text, which will be shown, when an enemy is missed. %1 = Enemy Name
 * @default Ah.. It's so close!
 * 
 * @help
 * With this plugin, you can add the possibility to catch enemies and add them
 * to your party.
 * But to make it work properly, you have to define an actor as a base. This
 * is needed, so that the enemy has a specific class, exp table, skills and
 * so on. This will be changed for future plugins. But currently it's easier
 * for you to work this way.
 *
 * You can catch an enemy via item or skill. You can define custom modifiers
 * for your skills and items. You can also add JavaScript statements to it
 * if you want to. There are several notetags available.
 *
 * I used the catch formula from Pokémon for this plugin, so every value above
 * 765 will result in an instant catch, if every other modification is at least
 * 1.0 or higher and the HP full.
 *
 * When an enemy is caught, the newly gained actor will have the enemy's hp, mp
 * and state changes. If used together with my MC_BaseStats and my
 * MC_EnemyLevels, the newly gained actor will also get the enemy's iv and
 * level.
 *
 *=============================================================================
 *   *  Possible Notetags (not case-sensitive)
 *=============================================================================
 * Enemies:
 * ----------------------------------------------------------------------------
 * <catch rate: x>
 * x = defines how hard/easy an enemy is to catch.
 * The higher the number, the easier to catch.
 *
 * <actor fix: x>
 * x = The ID of the actor to which it will be fixed.
 * Catching the same enemy over and over again results in multiple copies of
 * the actor.
 *
 * <catch rate eval>
 * code
 * </catch rate eval>
 * with these 2 notetags you can set the catch rate to be everything you
 * want as long as it's any JavaScript statement. The result will be added to
 * the other catch rate if used.
 *
 * Skills & Items:
 * ----------------------------------------------------------------------------
 * <masterball>
 * defines an item or skill as masterball and makes it so that it's always a
 * successes.
 *
 * <catch modifier: x.f>
 * x.f = the modifier rate. It is a float number.
 * 
 * <catch modifier eval>
 * code
 * </catch modifier eval>
 * with these 2 notetags you can set the catch modifier to be everything you
 * want as long as it's any JavaScript statement.The result will be added to
 * the other notetag if used.
 *
 * States:
 * ----------------------------------------------------------------------------
 * <catch modifier: x.f>
 * x.f = the modifier rate. It is a float number.
 * 
 * <catch modifier eval>
 * code
 * </catch modifier eval>
 * with these 2 notetags you can set the catch modifier to be everything you
 * want as long as it's any JavaScript statement. The result will be added to
 * the other notetag if used.
 * 
 *=============================================================================
 *   *  CatchSuccess Calculation
 *=============================================================================
 * The current formula used for the CatchSuccess Calculation is this one:
 *
 * (3 * maxHP - 2 * curHp) * rate * bonusBall
 * ------------------------------------------ * bonusStatus = valueX
 *             3 * maxHP
 *
 * If the resulted Value is greater than 255, then it's a sure catch. If not,
 * this formula will apply:
 *
 * 0x000FFFF0 / SquareRoot( SquareRoot( 0x00FF0000 / valueX))) = valueY
 *
 * valueY will be checked 4 times with a random generated number between
 * 0 and 65536. If valueY is greater than the randomized number, it means
 * the ball would shake once. If it passes all 4 checks, the enemy will
 * be caught.
 *
 * This is the actual CatchSuccess Calculation as it is used in the Pokémon
 * Games.
 *
 *
 *
 */
//=============================================================================

var Imported = Imported || {};
Imported.MC_FFP_CaptureSystem = true;

var MC = MC || {};
MC.PKM.CaptureSystem = MC.PKM.CaptureSystem || {};
MC.PKM.CaptureSystem.Parameter = PluginManager.parameters('MC_FFP_PKM_CaptureSystem');

MC.PKM.CaptureSystem.D1 = [0.3,0.5,0.7,0.8,0.9,1];
MC.PKM.CaptureSystem.D2 = [0,0.5,1,1.5,2,2.5];
MC.PKM.CaptureSystem.Shakes0Text = String(MC.PKM.CaptureSystem.Parameter['Shakes0 Text'] || "No! %1 gets out of the ball!");
MC.PKM.CaptureSystem.Shakes1Text = String(MC.PKM.CaptureSystem.Parameter['Shakes1 Text'] || "We are going to make it!");
MC.PKM.CaptureSystem.Shakes3Text = String(MC.PKM.CaptureSystem.Parameter['Shakes3 Text'] || "Ah.. It's so close!");
MC.PKM.CaptureSystem.CaughtText = String(MC.PKM.CaptureSystem.Parameter['CaughtText'] || "Gotcha! %1 was caught.");
MC.PKM.CaptureSystem.BaseCatchRate = parseInt(MC.PKM.CaptureSystem.Parameter['Base Catch Rate'] || "45");

//=============================================================================
// Saves the dataActors data
//=============================================================================
MC.PKM.CaptureSystem.makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
    var contents = MC.PKM.CaptureSystem.makeSaveContents.call(this);
	contents.dataActors   = $dataActors;
    return contents;
};

//=============================================================================
// Loads the dataActors data
//=============================================================================
MC.PKM.CaptureSystem.extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
	MC.PKM.CaptureSystem.extractSaveContents.call(this, contents);
	$dataActors		   = contents.dataActors;
};

//=============================================================================
// Loads the Notetags for Enemies, Skills, Items and States
//=============================================================================
MC.PKM.CaptureSystem.isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!MC.PKM.CaptureSystem.isDatabaseLoaded.call(this)) return false;
    this.getEnemyNotetags($dataEnemies);
    this.getISNotetags($dataSkills);
	this.getISNotetags($dataItems);
	this.getStateNotetags($dataStates);
    return true;
};

//=============================================================================
// Used for Notetags for Enemies
//=============================================================================
DataManager.getEnemyNotetags = function(group) {
	var noteCatchRate = /<(?:CATCH RATE):[ ](\d+)>/i;
	var noteActorFix = /<(?:ACTOR FIX):[ ](\d+)>/i;
	var noteCatchEval1 = /<(?:CATCH RATE EVAL)>/i;
	var noteCatchEval2 = /<\/(?:CATCH RATE EVAL)>/i;
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
		var notedata = obj.note.split(/[\r\n]+/);
        obj.catchRate = MC.PKM.CaptureSystem.BaseCatchRate;
		obj.actorFix = -1;
		obj.customRateEval = '';
		var mode = '';
		for (var i = 0; i < notedata.length; i++) {
			var line = notedata[i];
			if (line.match(noteCatchRate)) {
                obj.catchRate = parseInt(RegExp.$1);
			} else if (line.match(noteActorFix)) {
				obj.actorFix = parseInt(RegExp.$1);
			} else if (line.match(noteCatchEval1)) {
				mode = 'in';
			} else if (line.match(noteCatchEval2)) {
				mode = '';
			} else if (mode === 'in') {
				obj.customRateEval = obj.customRateEval + line + '\n';
			};
		};
	};
};

//=============================================================================
// Used for Notetags from Items and Skills
//=============================================================================
DataManager.getISNotetags = function(group) {
	var noteCatchModEval1 = /<(?:CATCH MODIFIER EVAL)>/i;
	var noteCatchModEval2 = /<\/(?:CATCH MODIFIER EVAL)>/i;
	var noteCatchModifier = /<(?:CATCH MODIFIER):[ ](\d+(\.\d+))>/i;
	var noteMasterball = /<(?:MASTERBALL)>/i;
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
		var notedata = obj.note.split(/[\r\n]+/);
		var mode = '';
		obj.customCatchMod = '';
		obj.catchMod = 0.0;
		obj.catchItem = false;
		obj.masterball = false;
		for (var i = 0; i < notedata.length; i++) {
			var line = notedata[i];
			if (line.match(noteCatchModifier)) {
				obj.catchMod = parseFloat(RegExp.$1);
				obj.catchItem = true;
			} else if (line.match(noteMasterball)) {
				obj.masterball = true;
				obj.catchItem = true;
			} else if (line.match(noteCatchModEval1)) {
				mode = 'in';
				obj.catchItem = true;
			} else if (line.match(noteCatchModEval2)) {
				mode = '';
			} else if (mode === 'in') {
				obj.customCatchMod = obj.customCatchMod + line + '\n';
			};
		};
	};
};

//=============================================================================
// Used the Notetags from States
//=============================================================================
DataManager.getStateNotetags = function(group) {
	var noteCatchModEval1 = /<(?:CATCH MODIFIER EVAL|catch modifier eval)>/i;
	var noteCatchModEval2 = /<\/(?:CATCH MODIFIER EVAL|catch modifier eval)>/i;
	var noteCatchModifier = /<(?:CATCH MODIFIER):[ ](\d+(\.\d+))>/i;
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
		var notedata = obj.note.split(/[\r\n]+/);
		var mode = '';
		obj.customCatchMod = '';
		obj.catchMod = 0.0;
		for (var i = 0; i < notedata.length; i++) {
			var line = notedata[i];
			if (line.match(noteCatchModifier)) {
				obj.catchMod = parseFloat(RegExp.$1);
			} else if (line.match(noteCatchModEval1)) {
				mode = 'in';
			} else if (line.match(noteCatchModEval2)) {
				mode = '';
			} else if (mode === 'in') {
				obj.customCatchMod = obj.customCatchMod + line + '\n';
			};
		};
	};
};

//=============================================================================
// Checks if the item is an Item for catching
//=============================================================================
Game_Action.prototype.isCatching = function() {
    return this.item().catchItem;
};

//=============================================================================
// Used to see, if the action is able to catch an enemy
//todo: the action can target teammate
//todo: and will not show error message when targetting otheother trainers' pokemons
//=============================================================================
MC.PKM.CaptureSystem.actionApply = Game_Action.prototype.apply;
Game_Action.prototype.apply = function(target) {
	MC.PKM.CaptureSystem.actionApply.call(this, target);
    if (this.isCatching() && target.isEnemy() && target.enemy().actorFix > 1) {
		BattleManager.catching(target, this.item());
    };
};

//=============================================================================
// Used for the catching sequence
// todo: we may have to change the method of creating new actor
// todo: need to add animation in the future
//=============================================================================
BattleManager.catching = function(target, item) {
    var shakes = target.catching(item);
    var name,text;
    switch(shakes){
        case 0: //doesn't shake
            name = MC.PKM.CaptureSystem.Shakes0Text;
            text = name.format(target.name());
            this._logWindow.push('addText',text);
            break;
        case 1: //shake once
            name = MC.PKM.CaptureSystem.Shakes1Text;
            text = name.format(target.name());
            this._logWindow.push('addText',text);
            break;
        case 2: //shake three times
            name = MC.PKM.CaptureSystem.Shakes3Text;
            text = name.format(target.name());
            this._logWindow.push('addText',text);
            break;
        case 3: //catch!
		    name = MC.PKM.CaptureSystem.CaughtText;
		    text = name.format(target.name());
		    this._logWindow.push('addText', text);
            //$gameParty.addNewCapture(target,item); //todo
            $dataActors.push($dataActors[target.enemy().actorFix]);
		    $gameParty.addActor($dataActors.length-1);
		    target.changeActor($gameParty.allMembers()[$gameParty.allMembers().length-1]);
		    target.hide();
            break;
        case 4: //ct but fail
            name = MC.PKM.CaptureSystem.Shakes1Text;
            text = name.format(target.name());
            this._logWindow.push('addText',text);
            break;
        case 5: //ct and success
		    name = MC.PKM.CaptureSystem.CaughtText;
		    text = name.format(target.name());
		    this._logWindow.push('addText', text);
            $dataActors.push($dataActors[target.enemy().actorFix]);
		    $gameParty.addActor($dataActors.length-1);
		    target.changeActor($gameParty.allMembers()[$gameParty.allMembers().length-1]);
		    target.hide();
            break;
        default:
            alert("There is an error in the Capture System where shakes go into default");

    }
};

/*
//=============================================================================
// Used to calculate if the enemy is caught. THis fomula suits Gen3 and Gen4
//=============================================================================
Game_Enemy.prototype.catching = function(item) {
	if (item.masterball) {return 4;};
	if (this.enemy().actorFix < 1) { return 0;};
	var hpMax = this.mhp;
	var hpCurr = this.hp
	var value = parseFloat(eval(item.customCatchMod));
	if (isNaN(value)) { value = 0.0; };
	var bonusBall = item.catchMod + value;
	var bonusStatus = 0.0;
	var rate = this.enemy().catchRate;
	var evalRate = eval(this.enemy().customRateEval);
	if (isNaN(evalRate)) { evalRrate = 0; };
	rate += evalRate;
	for (var i = 0; i < this._states.length; i++) {
		var mValue = parseFloat($dataStates[this._states[i]].catchMod);
		if (isNaN(mValue)) { mValue = 0.0; };
		bonusStatus += mValue;
		var nValue = parseFloat(eval($dataStates[this._states[i]].customCatchmod));
		if (isNaN(nValue)) { nValue = 0.0; };
		bonusStatus += nValue;
	};
	if (bonusStatus === 0.0) { bonusStatus = 1.0; };
	var valueX = ((((3 * hpMax - 2 * hpCurr) * rate * bonusBall) / (3 * hpMax)) * bonusStatus);
	valueX = Math.floor(valueX);
	var valueY = 0x000FFFF0/(Math.sqrt(Math.sqrt(0x00FF0000/valueX)));
	valueY = Math.floor(valueY);
	var shakes = 4;
	if (valueX < 255) {
		shakes = 0;
		if (valueX === 0) { valueX = 1; };
		for(var i=0; (i < 4) && (shakes === i); i++) {
			var rand = Math.random() * 65536;
			if (rand < valueY) {
				shakes++;
			};
		};
	};
	return shakes;
};
*/
//=============================================================================
// Used to calculate if the enemy is caught. This fomula only suits Gen5
//=============================================================================
Game_Enemy.prototype.catching = function(item) {
	if (item.masterball) {return 3;};
	if (this.enemy().actorFix < 1) { return 0;};
	var hpMax = this.mhp;
	var hpCurr = this.hp
	var value = parseFloat(eval(item.customCatchMod));
	if (isNaN(value)) { value = 0.0; };
	var bonusBall = item.catchMod + value;
	var bonusStatus = 0.0;
	var rate = this.enemy().catchRate;
	var evalRate = eval(this.enemy().customRateEval);
	if (isNaN(evalRate)) { evalRate = 0; };
	rate += evalRate;
	for (var i = 0; i < this._states.length; i++) {
		var mValue = parseFloat($dataStates[this._states[i]].catchMod);
		if (isNaN(mValue)) { mValue = 0.0; };
		bonusStatus += mValue;
		var nValue = parseFloat(eval($dataStates[this._states[i]].customCatchmod));
		if (isNaN(nValue)) { nValue = 0.0; };
		bonusStatus += nValue;
	};
    if (bonusStatus === 0.0) { bonusStatus = 1.0; };
    //todo: we need functions to realize D1 and D2 from Pokedex
    var d1 = MC.PKM.CaptureSystem.D1[3];
    var d2 = MC.PKM.CaptureSystem.D2[3];
    //todo -----------------------------------------------------
	var valueX = ((((3 * hpMax - 2 * hpCurr) * rate * d1 * bonusBall) / (3 * hpMax)) * bonusStatus);
    valueX = Math.floor(valueX);
	var valueY = 0x0000FFFF/(Math.sqrt(Math.sqrt(0x000000FF/valueX)));
	valueY = Math.floor(valueY);
	var shakes = 3;
	if (valueX < 255) {
        shakes = 0;
        if(Math.floor(Math.random() * 256) < valueX * d2) {
            var random = Math.random() * 65536;
            if(random < valueY){
                //* shakes == 5 represents critical throw and catched
                shakes = 5;
            }
            else{
                //* shakes == 4 represents critical throw and failed
                shakes = 4;
            }
        }
        else{
            for(var i = 0; (i < 3) && (shakes === i); i++) {
                if (Math.random() * 65536 < valueY) {
                    shakes++;
                }
            }
        }
    }
	return shakes;
};

//=============================================================================
// Changes Data from an Actor to the enemy data
//=============================================================================
Game_Enemy.prototype.changeActor = function(actor) {
	if (Imported.MC_FFP_PKM_BaseStats) {
		actor._iv = this._iv;
	};
	if (Imported.MC_FFP_PKM_EnemyLevels) {
		actor.changeLevel(this.getLevel(), false);
    };
    if (Imported.MC_SRD_PKM_Natures){
        
    }
	actor.setHp(this.hp);
	actor.setMp(this.mp);
	actor.setTp(this.tp);
	actor._states = this._states;
	actor._stateTurns = this._stateTurns;
};

//=============================================================================
// sets the Actor HP to the given Value
//=============================================================================
Game_Actor.prototype.setHp = function(value) {
	this._hp = value;
};

//=============================================================================
// sets the Actor MP to the given Value
//=============================================================================
Game_Actor.prototype.setMp = function(value) {
	this._mp = value;
};

//=============================================================================
// sets the Actor TP to the given Value
//=============================================================================
Game_Actor.prototype.setTp = function(value) {
	this._tp = value;
};
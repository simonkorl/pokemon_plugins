//=============================================================================
 /*:
 * @plugindesc v1.00; This plugin provides the ability to catch enemies. See help for more information.
 * @author FlipelyFlip
 * 
 * @param Base Catch Rate
 * @desc Base Catch Rate is used, when an enemy has no Catch Rate assigned. Default: 45
 * @default 45
 *
 * @param Caught Text
 * @desc Text, which will be shown, when an enemy is caught. %1 = Enemy Name
 * @default Gotcha! %1 was caught.
 *
 * @param Fail Text
 * @desc Text, which will be shown, when an enemy is not caught. %1 = Enemy Name
 * @default Shoot! It was so close!
 *
 * @param Miss Text
 * @desc Text, which will be shown, when an enemy is missed. %1 = Enemy Name
 * @default Darn! I missed %1.
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
 * and state changes. If used together with my FFP_BaseStats and my
 * FFP_EnemyLevels, the newly gained actor will also get the enemy's iv and
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
 * ------------------------------------------ * bonusStatus = valueA
 *             3 * maxHP
 *
 * If the resulted Value is greater than 255, then it's a sure catch. If not,
 * this formula will apply:
 *
 * 0x000FFFF0 / SquareRoot( SquareRoot( 0x00FF0000 / valueA))) = valueB
 *
 * valueB will be checked 4 times with a random generated number between
 * 0 and 65536. If valueB is greater than the randomized number, it means
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
Imported.FFP_CatchEnemies = true;

var FFP = FFP || {};
FFP.CatchEnemies = FFP.CatchEnemies || {};
FFP.CatchEnemies.Parameter = PluginManager.parameters('FFP_CatchEnemies');

//=============================================================================
// Saves the dataActors data
//=============================================================================
FFP.CatchEnemies.makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
    var contents = FFP.CatchEnemies.makeSaveContents.call(this);
	contents.dataActors   = $dataActors;
    return contents;
};

//=============================================================================
// Loads the dataActors data
//=============================================================================
FFP.CatchEnemies.extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
	FFP.CatchEnemies.extractSaveContents.call(this, contents);
	$dataActors		   = contents.dataActors;
};

//=============================================================================
// Loads the Notetags for Enemies, Skills, Items and States
//=============================================================================
FFP.CatchEnemies.isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!FFP.CatchEnemies.isDatabaseLoaded.call(this)) return false;
    this.getFfpEnemyNotetags($dataEnemies);
    this.getFfpLunaticNotetags($dataSkills);
	this.getFfpLunaticNotetags($dataItems);
	this.getFfpLunaticStateNotetags($dataStates);
    return true;
};

//=============================================================================
// Used for Notetags for Enemies
//=============================================================================
DataManager.getFfpEnemyNotetags = function(group) {
	var noteCatchRate = /<(?:CATCH RATE):[ ](\d+)>/i;
	var noteActorFix = /<(?:ACTOR FIX):[ ](\d+)>/i;
	var noteCatchEval1 = /<(?:CATCH RATE EVAL)>/i;
	var noteCatchEval2 = /<\/(?:CATCH RATE EVAL)>/i;
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
		var notedata = obj.note.split(/[\r\n]+/);
		obj.catchRate = FFP.CatchEnemies.Parameter['Base Catch Rate'];
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
DataManager.getFfpLunaticNotetags = function(group) {
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
DataManager.getFfpLunaticStateNotetags = function(group) {
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
//=============================================================================
FFP.CatchEnemies.actionApply = Game_Action.prototype.apply;
Game_Action.prototype.apply = function(target) {
	FFP.CatchEnemies.actionApply.call(this, target);
	console.log(this);
    if (this.isCatching() && target.isEnemy() && target.enemy().actorFix > 1) {
		BattleManager.catching(target, this.item());
    };
};

//=============================================================================
// Used for the catching sequence
//=============================================================================
BattleManager.catching = function(target, item) {
	this._logWindow.catchingEnemy();
	var shakes = target.catching(item);
	if (shakes === 4) {
		this._logWindow.catchingEnemySuccessfull();
		var names = FFP.CatchEnemies.Parameter['Caught Text'];
		var text = names.format(target.name());
		this._logWindow.push('addText', text);
		$dataActors.push($dataActors[target.enemy().actorFix]);
		$gameParty.addActor($dataActors.length-1);
		target.changeActor($gameParty.allMembers()[$gameParty.allMembers().length-1]);
		target.hide();
	};
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
	var valueA = ((((3 * hpMax - 2 * hpCurr) * rate * bonusBall) / (3 * hpMax)) * bonusStatus);
	valueA = Math.floor(valueA);
	var valueB = 0x000FFFF0/(Math.sqrt(Math.sqrt(0x00FF0000/valueA)));
	valueB = Math.floor(valueB);
	var shakes = 4;
	if (valueA < 255) {
		shakes = 0;
		if (valueA === 0) { valueA = 1; };
		for(var i=0; (i < 4) && (shakes === i); i++) {
			var rand = Math.random() * 65536;
			if (rand < valueB) {
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
	var valueA = ((((3 * hpMax - 2 * hpCurr) * rate * bonusBall) / (3 * hpMax)) * bonusStatus);
	valueA = Math.floor(valueA);
	var valueB = 0x000FFFF0/(Math.sqrt(Math.sqrt(0x00FF0000/valueA)));
	valueB = Math.floor(valueB);
	var shakes = 4;
	if (valueA < 255) {
        shakes = 0;
        var ct = false;
		if (valueA === 0) { valueA = 1; };
		for(var i=0; (i < 4) && (shakes === i); i++) {
			var rand = Math.random() * 65536;
			if (rand < valueB) {
				shakes++;
			};
		};
	};
	return shakes;
};
//=============================================================================
// Changes Data from an Actor to the enemy data
//=============================================================================
Game_Enemy.prototype.changeActor = function(actor) {
	if (Imported.FFP_PokemonBaseStats) {
		actor._iv = this._iv;
	};
	if (Imported.FFP_EnemyLevels) {
		actor.changeLevel(this.enemy().level, false);
	};
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

//=============================================================================
// Used for the Catch Messages.
//=============================================================================
FFP.CatchEnemies.catchInitialize = Window_BattleLog.prototype.initialize;
Window_BattleLog.prototype.initialize = function() {
	FFP.CatchEnemies.catchInitialize.call(this);
	this._catchAttempt = false;
	this._catchAttemptSuccessfull = false;
};

//=============================================================================
// Displays the Miss Message
//=============================================================================
Window_BattleLog.prototype.displayMiss = function(target) {
	if (!this.catchAttempt()) {
		var fmt;
		if (target.result().physical) {
			fmt = target.isActor() ? TextManager.actorNoHit : TextManager.enemyNoHit;
			this.push('performMiss', target);
		} else {
			fmt = TextManager.actionFailure;
		};
	} else {
		fmt = FFP.CatchEnemies.Parameter['Miss Text'];
	};
	this.push('addText', fmt.format(target.name()));
	this._catchAttempt = false;
};

//=============================================================================
// displays the Failure Message (used, if no Damage is dealt)
//=============================================================================
Window_BattleLog.prototype.displayFailure = function(target) {
	if (!this.catchAttempt() && !this.catchAttemptSuccessfull()) {
		if (target.result().isHit() && !target.result().success) {
			this.push('addText', TextManager.actionFailure.format(target.name()));
		}
	} else if (this.catchAttempt() && !this.catchAttemptSuccessfull()) {
		var fmt = FFP.CatchEnemies.Parameter['Fail Text'];
		this.push('addText', fmt.format(target.name()));
	};
	this._catchAttempt = false;
	this._catchAttemptSuccessfull = false;
};

//=============================================================================
// Returns the value of this._catchAttempt
//=============================================================================
Window_BattleLog.prototype.catchAttempt = function() {
	return this._catchAttempt;
};

//=============================================================================
// Sets the value of this._catchAttempt to true
//=============================================================================
Window_BattleLog.prototype.catchingEnemy = function() {
	this._catchAttempt = true;
};

//=============================================================================
// Returns the value of this._catchAttemptSuccessfull
//=============================================================================
Window_BattleLog.prototype.catchAttemptSuccessfull = function() {
	return this._catchAttemptSuccessfull;
};

//=============================================================================
// Sets the value of this._catchAttemptSuccessfull to true
//=============================================================================
Window_BattleLog.prototype.catchingEnemySuccessfull = function() {
	this._catchAttemptSuccessfull = true;
};
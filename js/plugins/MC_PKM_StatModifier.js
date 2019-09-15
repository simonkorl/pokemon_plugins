//=============================================================================
 /*:
 * @plugindesc v0.10; This Plugin adds Pokemon's Stat Modifier into RMMV. This is the base of MC's CriticalHitSystem and MC's DamageCore
 * WARNING: Place this plugin above all of MC's plugins.
 * REMINDER: This plugin will not directly affect the damage system. You need MC_YEP_DamageCore to enable it.
 * @author Monster Circuit
 *
 * @param stat level +1 text
 * @desc The text shows when the stat increases 1 level. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1's %2 rose!
 * 
 * @param stat level +2 text
 * @desc The text shows when the stat increases 2 levels. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1's %2 rose sharply!
 *
 * @param stat level +3+ text
 * @desc The text shows when the stat increases 3 or more levels. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1's %2 rose drastically!
 *
 * @param stat level reaches 6 text
 * @desc The text shows when the stat reaches level 6. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1 maxed its %2!
 * 
 * @param attack level reaches 6 text
 * @desc The text shows when attack's level reaches level 6.
 * @default %1 releases all its power!
 * 
 * @param stat level -1 text
 * @desc The text shows when the stat decrease 1 level. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1's %2 fell!
 * 
 * @param stat level -2 text
 * @desc The text shows when the stat decrease 2 levels. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1's %2 harshly fell!
 * 
 * @param stat level -3+ text
 * @desc The text shows when the stat decrease 3 or more levels. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1's %2 severely fell!
 * 
 * @param stat level won't increase text
 * @desc The text shows when the stat won't increase. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1's %2 won't go any higher!
 * 
 * @param stat level won't decrease text
 * @desc The text shows when the stat won't decrease. Use %1 to replace the pokemon name.Use %2 to replace the stat name.
 * @default %1's %2 won't go any lower!
 * 
 * @param stat level reset text
 * @desc The text shows when all the stat levels reset to zero.
 * @default stat changes were removed!
 * 
 * @help
 * 
 * todo: this plugin must to be updated to realize the stat reset during switching pokemon!
 * This script adds Pokemon's Stat Modifier into RMMV. This plugin allows RMMV to store and read stat modifier
 * as it is in Pokemon. 
 * It also offer notetags to add stat changes for skills and items. 
 * You can get the stat modify rate using functions.
 * 
 * ===========================================================================
 *  Notetags
 * ===========================================================================
 * <Stat Change: a,name(numId),X,rate = 100>
 * Use a or b to represent the actor or the enemy. 
 * 
 * name or numId shows the parameter to be modified, use just either of them.
 * 'name' and 'numId' are as follow:
 * Atk 0
 * Def 1
 * Sat 2
 * Sdf 3
 * Spd 4
 * Acu 5
 * Eva 6
 * 
 * X is an integer in [-6,6] showing the stat change level.
 * Use 'Max' or 'Min' if the skill will cause the stat reaches the maximum value or the minimum.
 * 
 * Rate is an integer in [0,100] showing the percentage an action will cause the stat change. 100% by default.
 * 
 * Put the tag into the comment of skills or items.
 * You can add multiple stat change tags into a single action.
 * 
 * Example:
 * Growl:
 * <Stat Change: b,Atk,-1,100>
 * Belly Drum:
 * <Stat Change: a,0,Max,100>
 * 
 * ===========================================================================
 *  Version
 * ===========================================================================
 * 0.10 Finish basic demo. //todo clear all the stat change when battle finished and a pokemon is switched.
 */
//=============================================================================
var Imported = Imported || {};
Imported.MC_PKM_StatModifier = true;

var MC = MC || {};
MC.PKM = MC.PKM || {};
MC.PKM.StatModifier = MC.PKM.StatModifier || {};
MC.PKM.StatModifier.modifyRate = [2/8,2/7,2/6,2/5,2/4,2/3,2/2,3/2,4/2,5/2,6/2,7/2,8/2];

MC.PKM.Parameters = PluginManager.parameters('MC_PKM_StatModifier');
MC.PKM.Param = MC.PKM.Param || {};
MC.PKM.Param.StatLevel1Text = MC.PKM.Parameters['stat level +1 text'];
MC.PKM.Param.StatLevel2Text = MC.PKM.Parameters['stat level +2 text'];
MC.PKM.Param.StatLevel3Text = MC.PKM.Parameters['stat level +3+ text'];
MC.PKM.Param.StatTo6Text = MC.PKM.Parameters['stat level reaches 6 text'];
MC.PKM.Param.AtkTo6Text = MC.PKM.Parameters['attack level reaches 6 text'];
MC.PKM.Param.StatLevelm1Text = MC.PKM.Parameters['stat level -1 text'];
MC.PKM.Param.StatLevelm2Text = MC.PKM.Parameters['stat level -2 text'];
MC.PKM.Param.StatLevelm3Text = MC.PKM.Parameters['stat level -3+ text'];
MC.PKM.Param.StatWontUpText = MC.PKM.Parameters["stat level won't increase text"];
MC.PKM.Param.StatWontDownText = MC.PKM.Parameters["stat level won't decrease text"];
MC.PKM.Param.StatLevelResetText = MC.PKM.Parameters["stat level reset text"];

//=============================================================================
// Add stat modifier array into BattleManager
// _statMod,[[actor],[enemy]]
// [atk, def, sat, sdf, spd, acu, eva]
// stat level is an integer from -6 to 6. Normally 0.
//=============================================================================
BattleManager._statMod = [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]];
BattleManager.resetStatLevel = function(){
    for(var j = 0;j < 2; ++j){
        for(var i = 0; i < 7; ++i){
            this._statMod[j][i] = 0;
        }
    }
}
//todo add stat reset switching pokemon
//=============================================================================
// stat change functions
//=============================================================================
BattleManager.statChange = function(target,numId,numChange){//target -> Game_Battler; numId,numChange ->Number
    var mod = target.isActor() ? 0 : 1;
    numId = parseInt(numId);
    numChange = parseInt(numChange);
    if(this._statMod[mod][numId] != undefined && numChange != 0){
        var curStat = this._statMod[mod][numId];
        var newStat = this._statMod[mod][numId] + numChange;
        newStat = newStat.clamp(-6,6);
        var name = '';
        switch(numId){
            case 0:
                name = TextManager.param(2);
                break;
            case 1:
                name = TextManager.param(3);
                break;
            case 2:
                name = TextManager.param(4);
                break;
            case 3:
                name = TextManager.param(5);
                break;
            case 4:
                name = TextManager.param(6);
                break;
            case 5:
                name = TextManager.param(8);
                break;
            case 6:
                name = TextManager.param(9);
                break;
            default:
                console.error("numId error in statChange switch");
                break;
        }
        if(newStat === curStat){
            numChange > 0 ? this._logWindow.push("addText",MC.PKM.Param.StatWontUpText.format(target.name(),name))
             : this._logWindow.push("addText",MC.PKM.Param.StatWontDownText.format(target.name(),name));
        }
        else{
            this._statMod[mod][numId] = newStat;
            if(numChange >= 3) 
                this._logWindow.push("addText",MC.PKM.Param.StatLevel3Text.format(target.name(),name));
            else if(numChange === 2) 
                this._logWindow.push("addText",MC.PKM.Param.StatLevel2Text.format(target.name(),name));
            else if(numChange === 1) 
                this._logWindow.push("addText",MC.PKM.Param.StatLevel1Text.format(target.name(),name));
            else if(numChange === -1) 
                this._logWindow.push("addText",MC.PKM.Param.StatLevelm1Text.format(target.name(),name));
            else if(numChange === -2) 
                this._logWindow.push("addText",MC.PKM.Param.StatLevelm2Text.format(target.name(),name));
            else if(numChange <= -3) 
                this._logWindow.push("addText",MC.PKM.Param.StatLevelm3Text.format(target.name(),name));
            
            if(newStat === 6 && numId === 0){
                this._logWindow.push("addText",MC.PKM.Param.AtkTo6Text.format(target.name()));
            }
        }    
        return true;
    }
    else
        return false;
}

BattleManager.statToMax = function(target,numId){ //target -> Game_Battler; numId ->Number
    var mod = target.isActor() ? 0 : 1;
    if(this._statMod[mod][numId] != undefined){
        var delta = 6 - this._statMod[mod][numId];
        if(delta === 0) 
            this._logWindow.push("addText",MC.PKM.Param.StatWontUpText.format(target.name(),name));
        else
            this.statChange(target,numId,delta);
        return true;
    }
    else
        return false;
}
BattleManager.statToMin = function(target,numId){ //target -> Game_Battler; numId ->Number
    var mod = target.isActor() ? 0 : 1;
    if(this._statMod[mod][numId] != undefined){
        var delta = -6 - this._statMod[mod][numId];
        if(delta === 0) 
            this._logWindow.push("addText",MC.PKM.Param.StatWontDownText.format(target.name(),name));
        else
            this.statChange(target,numId,delta);
        return true;
    }
    else
        return false;
}
BattleManager.getStatModifier = function(isEnemy, numId){ //isEnemy->bool, numId ->Number
    return this._statMod[isEnemy ? 1 : 0][numId];
}
BattleManager.getStatModifyRate = function(isEnemy,numId){ //isEnemy->bool, numId ->Number
    return MC.PKM.StatModifier.modifyRate[this._statMod[isEnemy ? 1 : 0][numId] + 6];
}
//===============================================================
// load notetag for skills and items
//===============================================================

MC.PKM.StatModifier._DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!MC.PKM.StatModifier._DataManager_isDatabaseLoaded.call(this)) return false;
    if (!MC.PKM.StatModifier._isloaded) {
      this.getStatChangesNotetags($dataSkills);
      this.getStatChangesNotetags($dataItems);
      MC.PKM.StatModifier._isloaded = true;
    }
        return true;
}
//=============================================================================
// Used for loading Notetags
//=============================================================================
DataManager.getStatChangesNotetags = function(group) {
	var noteStatChange = /<\s*(?:STAT CHANGE)\s*:\s*(a|b)\s*,\s*(\d|\D{3})\s*,\s*(-?\d)\s*,\s*(\d{1,3})\s*>/i;
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
        var notedata = obj.note.split(/[\r\n]+/);
        obj.statChangesData = [];
		for (var i = 0,line = "",myArray; i < notedata.length; i++) {
            line = notedata[i];
            myArray = line.match(noteStatChange);
			if (myArray) {
                var change = [-1,-1,0,0];
                change[0] = myArray[1] === 'a' ? 0 : 1;
                if(myArray[2].match(/\d/i)){
                    change[1] = parseInt(myArray[2]);
                }
                else{
                    switch(myArray[2].toLowerCase()){
                        case 'atk':
                            change[1] = 0;
                            break;
                        case 'def':
                            change[1] = 1;
                            break;
                        case 'sat':
                            change[1] = 2;
                            break;
                        case 'sdf':
                            change[1] = 3;
                            break;
                        case 'spd':
                            change[1] = 4;
                            break;
                        case 'acu':
                            change[1] = 5;
                            break;
                        case 'eva':
                            change[1] = 6;
                            break;
                        default:
                            console.error("stat change tag error! name is:" + myArray[2]);
                    }
                }
                change[2] = parseInt(myArray[3]);
                change[3] = parseInt(myArray[4]);
                obj.statChangesData.push(change);
            }
		}
	}
}
//=============================================================================
// Game_Action now can cause stat change
//=============================================================================
//MC.PKM.StatModifier._Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
Game_Action.prototype.applyItemUserEffect = function(target){
    for(var i = 0,change = []; i < this.item().statChangesData.length; ++i){
        change = this.item().statChangesData[i];
        if(change[3] != 0){
            if(Math.random() * 100 < change[3]){
                BattleManager.statChange(change[0] ? target:this.subject(),change[1],change[2]);
            }
        }
    }
}
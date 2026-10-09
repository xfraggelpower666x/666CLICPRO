import test from "node:test";import assert from "node:assert/strict";import{systemHeader,developerPanel}from"./unified-visual-header.mjs";
test("unknown metadata not fabricated",()=>{const x=systemHeader({system_id:"666CLIC",name:"CLIC",type:"SYSTEM",status:"PARTIAL",authority:"GITHUB",evidence:"readback"});assert.equal(x.ready,true);assert.equal(x.created_at,"UNKNOWN");assert.equal(x.logo,null)});
test("not active means no progress panel",()=>assert.equal(developerPanel({active:false}).visible,false));
test("no fake task progress",()=>assert.equal(developerPanel({active:true,tasks:[{id:"a",state:"DONE"}]}).progress,null));
test("measured task progress only",()=>{const x=developerPanel({active:true,tasks:[{id:"a",state:"DONE",evidence:"commit"},{id:"b",state:"OPEN"}]});assert.equal(x.progress.percent,50);assert.equal(x.junior.foreground,true);assert.equal(x.junior.pet_development,"PAUSED")});

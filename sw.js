if(!self.define){let e,a={};const r=(r,b)=>(r=new URL(r+".js",b).href,a[r]||new Promise((a=>{if("document"in self){const e=document.createElement("script");e.src=r,e.onload=a,document.head.appendChild(e)}else e=r,importScripts(r),a()})).then((()=>{let e=a[r];if(!e)throw new Error(`Module ${r} didn’t register its module`);return e})));self.define=(b,f)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(a[i])return;let d={};const t=e=>r(e,i),c={module:{uri:i},exports:d,require:t};a[i]=Promise.all(b.map((e=>c[e]||t(e)))).then((e=>(f(...e),d)))}}define(["./workbox-95f5d6f5"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"arrow.png",revision:"d7704f6cffa4dc8343df27f3b79203d5"},{url:"icon-128x128.png",revision:"c163bad5a7c5843d07391073cd08b0ce"},{url:"icon-144x144.png",revision:"f27f45d7633fe973672f725587db70bd"},{url:"icon-152x152.png",revision:"d5283640c53c721194ace8adca84d6f2"},{url:"icon-192x192.png",revision:"f99d77a1e17b2f7ff5fc490a7194aee1"},{url:"icon-384x384.png",revision:"0becd2c509daec527de587c1e2b93574"},{url:"icon-48x48.png",revision:"df3332f78fb71d8f213291bde3e91a69"},{url:"icon-512x512.png",revision:"ad38cc238a21c60fbefcc9e8e00bf007"},{url:"icon-72x72.png",revision:"2cac7444417af9958a2d5280e9c28c87"},{url:"icon-96x96.png",revision:"971aebcdcf58472e344d7f684b2b00d4"},{url:"index.html",revision:"56e9ec4c780be66a62ca9b516ae4a36b"},{url:"main2.js",revision:"798ac42744949d935daf197d91759f50"},{url:"manifest.webmanifest",revision:"3541cf36f0ddfb74391c856697aca467"},{url:"maskable_icon.png",revision:"f38ee68648d6d0a961b643003cb3a078"},{url:"nocache.html",revision:"0697e1ebad2aa6023221ba6e46c825fa"},{url:"pushups.png",revision:"4e70bc6c8283f5ee3aedce87c56f1bd1"},{url:"running.png",revision:"14dee348fc9b6465f529c20874985ad2"},{url:"shuttle.m4a",revision:"4198f5c64d1108b7108e530dbf4ba5fc"},{url:"shuttle.mp3",revision:"a2c4ed12a8cfe15d00c67ec9bd4f6886"},{url:"shuttle.ogg",revision:"30047df5eafcd8c91d03a805cb31feea"},{url:"situps.png",revision:"fb37ab70656da1264fb2105c00fbb271"},{url:"style.css",revision:"1da03929b3e36735ef2d97bce3721c66"},{url:"web formatted jpgs/female_25-29_cardio.webp",revision:"a72b313dc999f289616215d90349d3b5"},{url:"web formatted jpgs/female_25-29_Strength_Abs.webp",revision:"cca90c32e6316293004be13e7cd901a2"},{url:"web formatted jpgs/female_30-34_cardio.webp",revision:"58f07f55b6fcb5fb902d9cb53135575c"},{url:"web formatted jpgs/female_30-34_Strength_Abs.webp",revision:"676c9735da64077e8053cd4aebdae7cb"},{url:"web formatted jpgs/female_35-39_cardio.webp",revision:"e6e6590926bee71387f06ad6fd0417fd"},{url:"web formatted jpgs/female_35-39_Strength_Abs.webp",revision:"d0eba12961eae4735a6d007edb4f5aa8"},{url:"web formatted jpgs/female_40-44_cardio.webp",revision:"1f9c5061b95596d00e9cbb0299cae5c7"},{url:"web formatted jpgs/female_40-44_Strength_Abs.webp",revision:"340c4f70e178089ee1edcfbb1c183c3a"},{url:"web formatted jpgs/female_45-49_cardio.webp",revision:"b5be69af8e103d26474c1c44211d53db"},{url:"web formatted jpgs/female_45-49_Strength_Abs.webp",revision:"a4702c50c33caf84f29ffac61e74895b"},{url:"web formatted jpgs/female_50-54_cardio.webp",revision:"b0883b309391e7b96508621b5fa8791d"},{url:"web formatted jpgs/female_50-54_Strength_Abs.webp",revision:"f31730f561df1aefd6aba5b9e9f5824f"},{url:"web formatted jpgs/female_55-59_cardio.webp",revision:"0d164ea172617b9018a49b19be4a0321"},{url:"web formatted jpgs/female_55-59_Strength_Abs.webp",revision:"bfb013992c77236758e94092fe16b5a7"},{url:"web formatted jpgs/female_lessthan25_cardio.webp",revision:"12f5a76fd524997f5019d12428eeccf3"},{url:"web formatted jpgs/female_lessthan25_Strength_Abs.webp",revision:"c3189676fe4be418745bf1d7ecb4a977"},{url:"web formatted jpgs/female_over60_cardio.webp",revision:"9f72fb095b0f0205016eaf46f2a5c062"},{url:"web formatted jpgs/female_over60_Strength_Abs.webp",revision:"af52f13bbc416980d62e21a03976ac2a"},{url:"web formatted jpgs/male_25-29_cardio.webp",revision:"04fad0032e913851a92198ab657ad82c"},{url:"web formatted jpgs/male_25-29_Strength_Abs.webp",revision:"5a690023949d6b4f6f9d6974fd13c901"},{url:"web formatted jpgs/male_30-34_cardio.webp",revision:"486e69b26b07a2fbce399d0b1d6d0af4"},{url:"web formatted jpgs/male_30-34_Strength_Abs.webp",revision:"0870325a8a034012f3ecedf5a8e5594a"},{url:"web formatted jpgs/male_35-39_cardio.webp",revision:"a2777f746fde101413ddfe61bc31fc4c"},{url:"web formatted jpgs/male_35-39_Strength_Abs.webp",revision:"a8061c774ff26003a5bfc296a651eaa5"},{url:"web formatted jpgs/male_40-44_Run_Shuttle.webp",revision:"8cd526e7d55ba49b2b616032a3b5297f"},{url:"web formatted jpgs/male_40-44_Strength_Abs.webp",revision:"93e62a0221f1efe563271fa4a82b4121"},{url:"web formatted jpgs/male_45-49_cardio.webp",revision:"4e1c4a06426854a1759834673e2fcb25"},{url:"web formatted jpgs/male_45-49_Strength_Abs.webp",revision:"f97eb5d74e69ecee90f503dccd65c258"},{url:"web formatted jpgs/male_50-54_cardio.webp",revision:"bbfeca8957a157a89e3097c6c70544a3"},{url:"web formatted jpgs/male_50-54_Strength_Abs.webp",revision:"1e84587ce4f740ee8e13c23254c0c685"},{url:"web formatted jpgs/male_55-59_cardio.webp",revision:"271903b1902fd9eb89c88d38b92cc14b"},{url:"web formatted jpgs/male_55-59_Strength_Abs.webp",revision:"7d62d55f71aaa2fa3005d2240931c449"},{url:"web formatted jpgs/male_lessthan25_Run_Shuttle.webp",revision:"6e73dc0fe464d0ef208d09237f7a499c"},{url:"web formatted jpgs/male_lessthan25_Strength_Abs.webp",revision:"26a20d36547658fc6533c15b17efde79"},{url:"web formatted jpgs/male_over60_cardio.webp",revision:"94484bf7cc9f5cc233f58048b86a4f14"},{url:"web formatted jpgs/male_over60_Strength_Abs.webp",revision:"34112b0d26ab4f90755e9cdf133e4392"},{url:"web formatted jpgs/runAltitudeAdjust.webp",revision:"169d2d2cd976d57545bb09ae3564bb0b"},{url:"web formatted jpgs/shuttleScores.webp",revision:"4e90c3401473630cc52abfa6ed1a9535"},{url:"web formatted jpgs/walkAltitudeAdjust.webp",revision:"59aff8eb12ef06345c685331942c0fe7"},{url:"web formatted jpgs/walkChart.webp",revision:"6acb99713fa78a7e1086dfb7c6706f8b"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]}),e.registerRoute((({request:e})=>{const{destination:a}=e;return"video"===a||"audio"===a||"image"===a}),new e.CacheFirst({plugins:[new e.RangeRequestsPlugin]}),"GET"),e.registerRoute("**/*.{html,webmanifest,js,css,mjs}",new e.NetworkFirst,"GET")}));
//# sourceMappingURL=sw.js.map

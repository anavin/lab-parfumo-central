begin;
-- Seed data generated from seed/*.json. Run AFTER 0001_init.sql.

-- branches (2)
insert into branches (branch_code,store_code,store_no,tel,receiver,email_store,email_admin,address) values
('01_CTW - Central World','01_CTW','สาขาที่ 00001',null,null,null,null,null),
('02_SCS-Seacon Squar Srinakarin','02_SCS','Event',null,null,null,null,null);

-- products (355)
insert into products (barcode,scent,grade,size,sku,brand,price,description) values
('8857128011188','1000 Thousand','EDP','50 ml.','THD-50 ml','Lab Parfumo',1890,null),
('8857128012018','Aqua','EDP','50 ml.','AQA-50 ml','Lab Parfumo',1890,null),
('8857128011232','Argentum','EDP','50 ml.','ARM-50 ml','Lab Parfumo',1890,null),
('8857128011416','Atlantis','EDP','50 ml.','ATS-50 ml','Lab Parfumo',1890,null),
('8857128011072','Beyond','EDP','50 ml.','BED-50 ml','Lab Parfumo',1890,null),
('8857128011225','Blind Magnolia','EDP','50 ml.','BMA-50 ml','Lab Parfumo',1890,null),
('8857128012021','Buoyant','EDP','50 ml.','BUT-50 ml','Lab Parfumo',1890,null),
('8857128011782','Cherry Dance','EDP','50 ml.','CEB-50 ml','Lab Parfumo',1890,null),
('8857128011126','Cocoa Gourmet','EDP','50 ml.','COA-50 ml','Lab Parfumo',1890,null),
('8857128011423','Code Red','EDP','50 ml.','CRD-50 ml','Lab Parfumo',1890,null),
('8857128011300','Dream Island','EDP','50 ml.','DID-50 ml','Lab Parfumo',1890,null),
('8857128011010','Dynasty','EDP','50 ml.','DYY-50 ml','Lab Parfumo',1890,null),
('8857128011317','Eden','EDP','50 ml.','EDN-50 ml','Lab Parfumo',1890,null),
('8857128011133','Excalibur (EDP)','EDP','50 ml.','EXR-50 ml','Lab Parfumo',1890,null),
('8857128012140','Gentle Elixir','EDP','50 ml.','GER-50 ml','Lab Parfumo',1890,null),
('8857128011218','Found Peony','EDP','50 ml.','FPY-50 ml','Lab Parfumo',1890,null),
('8857128011034','Hercules','EDP','50 ml.','HES-50 ml','Lab Parfumo',1890,null),
('8857128011058','La Belle','EDP','50 ml.','LBE-50 ml','Lab Parfumo',1890,null),
('8857128011454','Legendary','EDP','50 ml.','LEY-50 ml','Lab Parfumo',1890,null),
('8857128012020','Make Way','EDP','50 ml.','MWY-50 ml','Lab Parfumo',1890,null),
('8857128011249','Mellow','EDP','50 ml.','MEL-50 ml','Lab Parfumo',1890,null),
('8857128011089','Moon Light','EDP','50 ml.','MLT-50 ml','Lab Parfumo',1890,null),
('8857128011287','Never Blue','EDP','50 ml.','NBE-50 ml','Lab Parfumo',1890,null),
('8857128011201','Perfect Pear','EDP','50 ml.','PPR-50 ml','Lab Parfumo',1890,null),
('8857128011041','Persist','EDP','50 ml.','PET-50 ml','Lab Parfumo',1890,null),
('8857128011119','Secret of Peach','EDP','50 ml.','SPH-50 ml','Lab Parfumo',1890,null),
('8857128011171','Senorita','EDP','50 ml.','SEA-50 ml','Lab Parfumo',1890,null),
('8857128011294','Shadow De Bacci Light','EDP','50 ml.','SBT-50 ml','Lab Parfumo',1890,null),
('8857128011140','Sicilia','EDP','50 ml.','SIA-50 ml','Lab Parfumo',1890,null),
('8857128012144','Soir','EDP','50 ml.','SOR-50 ml','Lab Parfumo',1890,null),
('8857128011096','Teenage Dream','EDP','50 ml.','TDM-50 ml','Lab Parfumo',1890,null),
('8857128011522','Velvet Oud','EDP','50 ml.','VOD-50 ml','Lab Parfumo',1890,null),
('8857128011164','Victory','EDP','50 ml.','VIY-50 ml','Lab Parfumo',1890,null),
('8857128011270','Vintage','EDP','50 ml.','VIE-50 ml','Lab Parfumo',1890,null),
('8857128011256','Virgin X','EDP','50 ml.','VIX-50 ml','Lab Parfumo',1890,null),
('8857128011065','Vivid','EDP','50 ml.','VID-50 ml','Lab Parfumo',1890,null),
('8857128012019','Voyage','EDP','50 ml.','VOE-50 ml','Lab Parfumo',1890,null),
('8857128011027','Zeus','EDP','50 ml.','ZES-50 ml','Lab Parfumo',1890,null),
('8857128011652','Amber Spangle','EDP+','50 ml.','ASE-50 ml','Lab Parfumo',2890,null),
('8857128011669','Blackest Black','EDP+','50 ml.','BBK-50 ml','Lab Parfumo',2890,null),
('8857128011331','Dionysus X','EDP','50 ml.','DIX-50 ml','Lab Parfumo',1890,null),
('8857128011676','Impression','EDP+','50 ml.','IMN-50 ml','Lab Parfumo',2890,null),
('8857128011683','Legend of Oud','EDP+','50 ml.','LOD-50 ml','Lab Parfumo',2890,null),
('8857128011690','Luscious Santal','EDP+','50 ml.','LSL-50 ml','Lab Parfumo',2890,null),
('8857128011706','Patchouli Absolute','EDP+','50 ml.','PAE-50 ml','Lab Parfumo',2890,null),
('8857128011386','Rose Oud','EDP+','50 ml.','ROD-50 ml','Lab Parfumo',2890,null),
('8857128011713','Sparkling Mandarin','EDP+','50 ml.','SMN-50 ml','Lab Parfumo',2890,null),
('8857128011720','Tropical Leather','EDP+','50 ml.','TLR-50 ml','Lab Parfumo',2890,null),
('8857128011348','Vandal','EDP','50 ml.','VAL-50 ml','Lab Parfumo',null,null),
('8857128011379','Wealth','EDP','50 ml.','WEH-50 ml','Lab Parfumo',null,null),
('8857128011591','Gambling34+35','PARFUM','50 ml.','GAG-50 ml','Lab Parfumo',3040,null),
('8857128011607','Queen','PARFUM','50 ml.','QUN-50 ml','Lab Parfumo',3040,null),
('8857128011614','Savoury','PARFUM','50 ml.','SAP-50 ml','Lab Parfumo',3040,null),
('8857128011645','What','PARFUM','50 ml.','WHP-50 ml','Lab Parfumo',3040,null),
('8857128012052','1000 Thousand','EDP','4 ml.','THD-4 ml','Lab Parfumo',179,null),
('8857128012044','Aqua','EDP','4 ml.','AQA-4 ml','Lab Parfumo',179,null),
('8857128012033','Beyond','EDP','4 ml.','BED-4 ml','Lab Parfumo',179,null),
('8857128012066','Blind Magnolia','EDP','4 ml.','BMA-4 ml','Lab Parfumo',179,null),
('8857128012078','Buoyant','EDP','4 ml.','BUT-4 ml','Lab Parfumo',179,null),
('8857128012121','Cherry Dance','EDP','4 ml.','CEB-4 ml','Lab Parfumo',179,null),
('8857128012107','Cocoa Gourmet','EDP','4 ml.','COA-4 ml','Lab Parfumo',179,null),
('8857128012083','Code Red','EDP','4 ml.','CRD-4 ml','Lab Parfumo',179,null),
('8857128012015','Dream Island','EDP','4 ml.','DID-4 ml','Lab Parfumo',179,null),
('8857128012129','Dynasty','EDP','4 ml.','DYY-4 ml','Lab Parfumo',179,null),
('8857128012059','Eden','EDP','4 ml.','EDN-4 ml','Lab Parfumo',179,null),
('8857128012063','Excalibur (EDP)','EDP','4 ml.','EXR-4 ml','Lab Parfumo',179,null),
('8857128012143','Gentle Elixir','EDP','4 ml.','GER-4 ml','Lab Parfumo',179,null),
('8857128012091','Found Peony','EDP','4 ml.','FPY-4 ml','Lab Parfumo',179,null),
('8857128011546','Hercules','EDP','4 ml.','HES-4 ml','Lab Parfumo',179,null),
('8857128012016','La Belle','EDP','4 ml.','LBE-4 ml','Lab Parfumo',179,null),
('8857128012074','Legendary','EDP','4 ml.','LEY-4 ml','Lab Parfumo',179,null),
('8857128012049','Make Way','EDP','4 ml.','MWY-4 ml','Lab Parfumo',179,null),
('8857128012150','Mellow','EDP','4 ml.','MEL-4 ml','Lab Parfumo',179,null),
('8857128012068','Moon Light','EDP','4 ml.','MLT-4 ml','Lab Parfumo',179,null),
('8857128012036','Never Blue','EDP','4 ml.','NBE-4 ml','Lab Parfumo',179,null),
('8857128012085','Perfect Pear','EDP','4 ml.','PPR-4 ml','Lab Parfumo',179,null),
('8857128012043','Persist','EDP','4 ml.','PET-4 ml','Lab Parfumo',179,null),
('8857128012038','Secret of Peach','EDP','4 ml.','SPH-4 ml','Lab Parfumo',179,null),
('8857128012040','Senorita','EDP','4 ml.','SEA-4 ml','Lab Parfumo',179,null),
('8857128012094','Shadow De Bacci Light','EDP','4 ml.','SBT-4 ml','Lab Parfumo',179,null),
('8857128012056','Sicilia','EDP','4 ml.','SIA-4 ml','Lab Parfumo',179,null),
('8857128012147','Soir','EDP','4 ml.','SOR-4 ml','Lab Parfumo',179,null),
('8857128012071','Teenage Dream','EDP','4 ml.','TDM-4 ml','Lab Parfumo',179,null),
('8857128012046','Velvet Oud','EDP','4 ml.','VOD-4 ml','Lab Parfumo',179,null),
('8857128011751','Victory','EDP','4 ml.','VIY-4 ml','Lab Parfumo',179,null),
('8857128012080','Vintage','EDP','4 ml.','VIE-4 ml','Lab Parfumo',179,null),
('8857128012054','Virgin X','EDP','4 ml.','VIX-4 ml','Lab Parfumo',179,null),
('8857128012061','Vivid','EDP','4 ml.','VID-4 ml','Lab Parfumo',179,null),
('8857128012045','Voyage','EDP','4 ml.','VOE-4 ml','Lab Parfumo',179,null),
('8857128012017','Zeus','EDP','4 ml.','ZES-4 ml','Lab Parfumo',179,null),
('8857128012102','Blackest Black','EDP+','4 ml.','BBK-4 ml','Lab Parfumo',270,null),
('8857128012088','Dionysus X','EDP','4 ml.','DIX-4 ml','Lab Parfumo',179,null),
('8857128012127','Impression','EDP+','4 ml.','IMN-30 ml','Lab Parfumo',270,null),
('8857128012111','Legend of Oud','EDP+','4 ml.','LOD-4 ml','Lab Parfumo',270,null),
('8857128012123','Luscious Santal','EDP+','4 ml.','LSL-4 ml','Lab Parfumo',270,null),
('8857128012115','Patchouli Absolute','EDP+','4 ml.','PAE-4 ml','Lab Parfumo',270,null),
('8857128012109','Sparkling Mandarin','EDP+','4 ml.','SMN-4 ml','Lab Parfumo',270,null),
('8857128012113','Tropical Leather','EDP+','4 ml.','TLR-4 ml','Lab Parfumo',270,null),
('8857128012076','Vandal','EDP+','4 ml.','VAL-4 ml','Lab Parfumo',270,null),
('8857128012097','Wealth','EDP+','4 ml.','WEH-4 ml','Lab Parfumo',270,null),
('8857128012104','Gambling34+35','PARFUM','4 ml.','GAG-4 ml','Lab Parfumo',310,null),
('8857128012117','Queen','PARFUM','4 ml.','QUN-4 ml','Lab Parfumo',310,null),
('8857128012119','Savoury','PARFUM','4 ml.','SAP-4 ml','Lab Parfumo',310,null),
('8857128012125','What','PARFUM','4 ml.','WHP-4 ml','Lab Parfumo',310,null),
('8857128012050','1000 Thousand','EDP','30 ml.','THD-30 ml','Lab Parfumo',1290,null),
('8857128012022','Aqua','EDP','30 ml.','AQA-30 ml','Lab Parfumo',1290,null),
('8857128011928','Atlantis','EDP','30 ml.','ATS-30 ml','Lab Parfumo',1290,null),
('8857128012031','Beyond','EDP','30 ml.','BED-30 ml','Lab Parfumo',1290,null),
('8857128012064','Blind Magnolia','EDP','30 ml.','BMA-30 ml','Lab Parfumo',1290,null),
('8857128012025','Buoyant','EDP','30 ml.','AUT-30 ml','Lab Parfumo',1290,null),
('8857128011959','Cherry Dance','EDP','30 ml.','CDY-30 ml','Lab Parfumo',1290,null),
('8857128012105','Cocoa Gourmet','EDP','30 ml.','COA-30 ml','Lab Parfumo',1290,null),
('8857128012081','Code Red','EDP','30 ml.','CRD-30 ml','Lab Parfumo',1290,null),
('8857128011874','Dream Island','EDP','30 ml.','DID-30 ml','Lab Parfumo',1290,null),
('8857128011812','Dynasty','EDP','30 ml.','AMS-30 ml','Lab Parfumo',1290,null),
('8857128012057','Eden','EDP','30 ml.','EDN-30 ml','Lab Parfumo',1290,null),
('8857128011935','Excalibur (EDP)','EDP','30 ml.','EXR-30 ml','Lab Parfumo',1290,null),
('8857128012141','Gentle Elixir','EDP','30 ml.','GER-30 ml','Lab Parfumo',1290,null),
('8857128012089','Found Peony','EDP','30 ml.','FPY-30 ml','Lab Parfumo',1290,null),
('8857128011737','Hercules','EDP','30 ml.','HES-30 ml','Lab Parfumo',1290,null),
('8857128011904','La Belle','EDP','30 ml.','LBE-30 ml','Lab Parfumo',1290,null),
('8857128012072','Legendary','EDP','30 ml.','LEY-30 ml','Lab Parfumo',1290,null),
('8857128012024','Make Way','EDP','30 ml.','MWY-30 ml','Lab Parfumo',1290,null),
('8857128012148','Mellow','EDP','30 ml.','MEL-30 ml','Lab Parfumo',1290,null),
('8857128012014','Moon Light','EDP','30 ml.','MOT-30 ml','Lab Parfumo',1290,null),
('8857128011836','Never Blue','EDP','30 ml.','NBE-30 ml','Lab Parfumo',1290,null),
('8857128011973','Perfect Pear','EDP','30 ml.','PPR-30 ml','Lab Parfumo',1290,null),
('8857128011881','Persist','EDP','30 ml.','PET-30 ml','Lab Parfumo',1290,null),
('8857128011850','Secret of Peach','EDP','30 ml.','SPH-30 ml','Lab Parfumo',1290,null),
('8857128011867','Senorita','EDP','30 ml.','SEA-30 ml','Lab Parfumo',1290,null),
('8857128012092','Shadow De Bacci Light','EDP','30 ml.','SBT-30 ml','Lab Parfumo',1290,null),
('8857128011911','Sicilia','EDP','30 ml.','SIA-30 ml','Lab Parfumo',1290,null),
('8857128012145','Soir','EDP','30 ml.','SOR-30 ml','Lab Parfumo',1290,null),
('8857128012069','Teenage Dream','EDP','30 ml.','TDM-30 ml','Lab Parfumo',1290,null),
('8857128012048','Velvet Oud','EDP','30 ml.','VOD-30 ml','Lab Parfumo',1290,null),
('8857128011430','Victory','EDP','30 ml.','VIY-30 ml','Lab Parfumo',1290,null),
('8857128011966','Vintage','EDP','30 ml.','VIE-30 ml','Lab Parfumo',1290,null),
('8857128011997','Virgin X','EDP','30 ml.','VIX-30 ml','Lab Parfumo',1290,null),
('8857128011898','Vivid','EDP','30 ml.','VID-30 ml','Lab Parfumo',1290,null),
('8857128012023','Voyage','EDP','30 ml.','VOE-30 ml','Lab Parfumo',1290,null),
('8857128011843','Zeus','EDP','30 ml.','ZES-30 ml','Lab Parfumo',1290,null),
('8857128012004','Amber Spangle','EDP+','30 ml.','ASE-30 ml','Lab Parfumo',1890,null),
('8857128012005','Blackest Black','EDP+','30 ml.','BBK-30 ml','Lab Parfumo',1890,null),
('8857128012086','Dionysus X','EDP','30 ml.','DIX-30 ml','Lab Parfumo',1290,null),
('8857128012006','Impression','EDP+','30 ml.','AMN-30 ml','Lab Parfumo',1890,null),
('8857128012007','Legend of Oud','EDP+','30 ml.','LOD-30 ml','Lab Parfumo',1890,null),
('8857128012008','Luscious Santal','EDP+','30 ml.','LSL-30 ml','Lab Parfumo',1890,null),
('8857128012009','Patchouli Absolute','EDP+','30 ml.','PAE-30 ml','Lab Parfumo',1890,null),
('8857128011942','Rose Oud','EDP+','30 ml.','ROD-30 ml','Lab Parfumo',1290,null),
('8857128012010','Sparkling Mandarin','EDP+','30 ml.','SMN-30 ml','Lab Parfumo',1890,null),
('8857128012011','Tropical Leather','EDP+','30 ml.','TLR-30 ml','Lab Parfumo',1890,null),
('8857128011980','Vandal','EDP','30 ml.','VAL-30 ml','Lab Parfumo',1290,null),
('8857128012095','Wealth','EDP','30 ml.','WEH-30 ml','Lab Parfumo',1290,null),
('8857128012001','Queen','PARFUM','30 ml.','QUN-30 ml','Lab Parfumo',2190,null),
('8857128012002','Savoury','PARFUM','30 ml.','SAY-30 ml','Lab Parfumo',2190,null),
('8857128012013','What','PARFUM','30 ml.','WHA-30 ml','Lab Parfumo',2190,null),
('8857128012051','1000 Thousand','EDP','10 ml.','THD-10 ml','Lab Parfumo',450,null),
('8857128012026','Aqua','EDP','10 ml.','AQA-10 ml','Lab Parfumo',450,null),
('8857128012032','Beyond','EDP','10 ml.','BED-10 ml','Lab Parfumo',450,null),
('8857128012065','Blind Magnolia','EDP','10 ml.','BMA-10 ml','Lab Parfumo',450,null),
('8857128012077','Buoyant','EDP','10 ml.','BUT-10 ml','Lab Parfumo',450,null),
('8857128012120','Cherry Dance','EDP','10 ml.','CEB-10 ml','Lab Parfumo',450,null),
('8857128012106','Cocoa Gourmet','EDP','10 ml.','COA-10 ml','Lab Parfumo',450,null),
('8857128012082','Code Red','EDP','10 ml.','CRD-10 ml','Lab Parfumo',450,null),
('8857128012030','Dream Island','EDP','10 ml.','DID-10 ml','Lab Parfumo',450,null),
('8857128012128','Dynasty','EDP','10 ml.','DYY-10 ml','Lab Parfumo',450,null),
('8857128012058','Eden','EDP','10 ml.','EDN-10 ml','Lab Parfumo',450,null),
('8857128012062','Excalibur (EDP)','EDP','10 ml.','EXR-10 ml','Lab Parfumo',450,null),
('8857128012090','Found Peony','EDP','10 ml.','FPY-10 ml','Lab Parfumo',450,null),
('8857128012142','Gentle Elixir','EDP','10 ml.','GER-10 ml','Lab Parfumo',450,null),
('8857128011744','Hercules','EDP','10 ml.','HES-10 ml','Lab Parfumo',450,null),
('8857128012034','La Belle','EDP','10 ml.','LBE-10 ml','Lab Parfumo',450,null),
('8857128012073','Legendary','EDP','10 ml.','LEY-10 ml','Lab Parfumo',450,null),
('8857128012028','Make Way','EDP','10 ml.','MWY-10 ml','Lab Parfumo',450,null),
('8857128012149','Mellow','EDP','10 ml.','MEL-10 ml','Lab Parfumo',450,null),
('8857128012067','Moon Light','EDP','10 ml.','MLT-10 ml','Lab Parfumo',450,null),
('8857128012035','Never Blue','EDP','10 ml.','NBE-10 ml','Lab Parfumo',450,null),
('8857128012084','Perfect Pear','EDP','10 ml.','PPR-10 ml','Lab Parfumo',450,null),
('8857128012042','Persist','EDP','10 ml.','PET-10 ml','Lab Parfumo',450,null),
('8857128012037','Secret of Peach','EDP','10 ml.','SPH-10 ml','Lab Parfumo',450,null),
('8857128012039','Senorita','EDP','10 ml.','SEA-10 ml','Lab Parfumo',450,null),
('8857128012093','Shadow De Bacci Light','EDP','10 ml.','SBT-10 ml','Lab Parfumo',450,null),
('8857128012055','Sicilia','EDP','10 ml.','SIA-10 ml','Lab Parfumo',450,null),
('8857128012146','Soir','EDP','10 ml.','SOR-10 ml','Lab Parfumo',450,null),
('8857128012070','Teenage Dream','EDP','10 ml.','TDM-10 ml','Lab Parfumo',450,null),
('8857128012047','Velvet Oud','EDP','10 ml.','VOD-10 ml','Lab Parfumo',450,null),
('8857128011263','Victory','EDP','10 ml.','VIY-10 ml','Lab Parfumo',450,null),
('8857128012079','Vintage','EDP','10 ml.','VIE-10 ml','Lab Parfumo',450,null),
('8857128012053','Virgin X','EDP','10 ml.','VIX-10 ml','Lab Parfumo',450,null),
('8857128012060','Vivid','EDP','10 ml.','VID-10 ml','Lab Parfumo',450,null),
('8857128012027','Voyage','EDP','10 ml.','VOE-10 ml','Lab Parfumo',450,null),
('8857128012041','Zeus','EDP','10 ml.','ZES-10 ml','Lab Parfumo',450,null),
('8857128012101','Blackest Black','EDP+','10 ml.','BBK-10 ml','Lab Parfumo',650,null),
('8857128012087','Dionysus X','EDP','10 ml.','DIX-10 ml','Lab Parfumo',450,null),
('8857128012126','Impression','EDP+','10 ml.','IMN-30 ml','Lab Parfumo',650,null),
('8857128012110','Legend of Oud','EDP+','10 ml.','LOD-10 ml','Lab Parfumo',650,null),
('8857128012122','Luscious Santal','EDP+','10 ml.','LSL-10 ml','Lab Parfumo',650,null),
('8857128012114','Patchouli Absolute','EDP+','10 ml.','PAE-10 ml','Lab Parfumo',650,null),
('8857128012108','Sparkling Mandarin','EDP+','10 ml.','SMN-10 ml','Lab Parfumo',650,null),
('8857128012112','Tropical Leather','EDP+','10 ml.','TLR-10 ml','Lab Parfumo',650,null),
('8857128012075','Vandal','EDP','10 ml.','VAL-10 ml','Lab Parfumo',650,null),
('8857128012096','Wealth','EDP','10 ml.','WEH-10 ml','Lab Parfumo',450,null),
('8857128012103','Gambling34+35','PARFUM','10 ml.','GAG-10 ml','Lab Parfumo',850,null),
('8857128012116','Queen','PARFUM','10 ml.','QUN-10 ml','Lab Parfumo',850,null),
('8857128012118','Savoury','PARFUM','10 ml.','SAP-10 ml','Lab Parfumo',850,null),
('8857128012124','What','PARFUM','10 ml.','WHP-10 ml','Lab Parfumo',850,null),
('THM50','1000 Thousand TRY ME!','EDP','50 ml.','THM-50 ml','Lab Parfumo',0,null),
('AQM50','Aqua TRY ME!','EDP','50 ml.','AQM-50 ml','Lab Parfumo',0,null),
('AMM50','Argentum TRY ME!','EDP','50 ml.','AMM-50 ml','Lab Parfumo',0,null),
('ATM50','Atlantis TRY ME!','EDP','50 ml.','ATM-50 ml','Lab Parfumo',0,null),
('BYM50','Beyond TRY ME!','EDP','50 ml.','BYM-50 ml','Lab Parfumo',0,null),
('BMM50','Blind Magnolia TRY ME!','EDP','50 ml.','BMM-50 ml','Lab Parfumo',0,null),
('BUM50','Buoyant TRY ME!','EDP','50 ml.','BUM-50 ml','Lab Parfumo',0,null),
('CDM50','Cherry Dance TRY ME!','EDP','50 ml.','CDM-50 ml','Lab Parfumo',0,null),
('CGM50','Cocoa Gourmet TRY ME!','EDP','50 ml.','CGM-50 ml','Lab Parfumo',0,null),
('CRM50','Code Red TRY ME!','EDP','50 ml.','CRM-50 ml','Lab Parfumo',0,null),
('DIM50','Dream Island TRY ME!','EDP','50 ml.','DIM-50 ml','Lab Parfumo',0,null),
('DYM50','Dynasty TRY ME!','EDP','50 ml.','DYM-50 ml','Lab Parfumo',0,null),
('EDM50','Eden TRY ME!','EDP','50 ml.','EDM-50 ml','Lab Parfumo',0,null),
('EXM50','Excalibur (EDP) TRY ME!','EDP','50 ml.','EXM-50 ml','Lab Parfumo',0,null),
('FPM50','Found Peony TRY ME!','EDP','50 ml.','FPM-50 ml','Lab Parfumo',0,null),
('GER50','Gentle Elixir TRY ME!','EDP','50 ml.','GEM-50 ml','Lab Parfumo',0,null),
('HEM50','Hercules TRY ME!','EDP','50 ml.','HEM-50 ml','Lab Parfumo',0,null),
('LBM50','La Belle TRY ME!','EDP','50 ml.','LBM-50 ml','Lab Parfumo',0,null),
('LEM50','Legendary TRY ME!','EDP','50 ml.','LEM-50 ml','Lab Parfumo',0,null),
('MWM50','Make Way TRY ME!','EDP','50 ml.','MWM-50 ml','Lab Parfumo',0,null),
('MLM50','Moon Light TRY ME!','EDP','50 ml.','MLM-50 ml','Lab Parfumo',0,null),
('NBM50','Never Blue TRY ME!','EDP','50 ml.','NBM-50 ml','Lab Parfumo',0,null),
('PPM50','Perfect Pear TRY ME!','EDP','50 ml.','PPM-50 ml','Lab Parfumo',0,null),
('PEM50','Persist TRY ME!','EDP','50 ml.','PEM-50 ml','Lab Parfumo',0,null),
('SPM50','Secret of Peach TRY ME!','EDP','50 ml.','SPM-50 ml','Lab Parfumo',0,null),
('SEM50','Senorita TRY ME!','EDP','50 ml.','SEM-50 ml','Lab Parfumo',0,null),
('SLM50','Shadow De Bacci Light TRY ME!','EDP','50 ml.','SLM-50 ml','Lab Parfumo',0,null),
('SIM50','Sicilia TRY ME!','EDP','50 ml.','SIM-50 ml','Lab Parfumo',0,null),
('SOM50','Soir TRY ME!','EDP','50 ml.','SOM-50 ml','Lab Parfumo',0,null),
('TEM50','Teenage Dream TRY ME!','EDP','50 ml.','TEM-50 ml','Lab Parfumo',0,null),
('VOM50','Velvet Oud TRY ME!','EDP','50 ml.','VOM-50 ml','Lab Parfumo',0,null),
('VYM50','Victory TRY ME!','EDP','50 ml.','VYM-50 ml','Lab Parfumo',0,null),
('VEM50','Vintage TRY ME!','EDP','50 ml.','VEM-50 ml','Lab Parfumo',0,null),
('VXM50','Virgin X TRY ME!','EDP','50 ml.','VXM-50 ml','Lab Parfumo',0,null),
('VIM50','Vivid TRY ME!','EDP','50 ml.','VIM-50 ml','Lab Parfumo',0,null),
('VGM50','Voyage TRY ME!','EDP','50 ml.','VGM-50 ml','Lab Parfumo',0,null),
('ZEM50','Zeus TRY ME!','EDP','50 ml.','ZEM-50 ml','Lab Parfumo',0,null),
('ASM50','Amber Spangle TRY ME!','EDP+','50 ml.','ASM-50 ml','Lab Parfumo',0,null),
('BBM50','Blackest Black TRY ME!','EDP+','50 ml.','BBM-50 ml','Lab Parfumo',0,null),
('DXM50','Dionysus X TRY ME!','EDP+','50 ml.','DXM-50 ml','Lab Parfumo',0,null),
('IMM50','Impression TRY ME!','EDP+','50 ml.','IMM-50 ml','Lab Parfumo',0,null),
('LOM50','Legend of Oud TRY ME!','EDP+','50 ml.','LOM-50 ml','Lab Parfumo',0,null),
('LSM50','Luscious Santal TRY ME!','EDP+','50 ml.','LSM-50 ml','Lab Parfumo',0,null),
('PAM50','Patchouli Absolute TRY ME!','EDP+','50 ml.','PAM-50 ml','Lab Parfumo',0,null),
('ROM50','Rose Oud TRY ME!','EDP+','50 ml.','ROM-50 ml','Lab Parfumo',0,null),
('SMM50','Sparkling Mandarin TRY ME!','EDP+','50 ml.','SMM-50 ml','Lab Parfumo',0,null),
('TLM50','Tropical Leather TRY ME!','EDP+','50 ml.','TLM-50 ml','Lab Parfumo',0,null),
('VAM50','Vandal TRY ME!','EDP+','50 ml.','VAM-50 ml','Lab Parfumo',0,null),
('WEM50','Wealth TRY ME!','EDP+','50 ml.','WEM-50 ml','Lab Parfumo',0,null),
('GAM50','Gambling34+35 TRY ME!','PARFUM','50 ml.','GAM-50 ml','Lab Parfumo',0,null),
('QUM50','Queen TRY ME!','PARFUM','50 ml.','QUM-50 ml','Lab Parfumo',0,null),
('SAM50','Savoury TRY ME!','PARFUM','50 ml.','SAM-50 ml','Lab Parfumo',0,null),
('WHM50','What TRY ME!','PARFUM','50 ml.','WHM-50 ml','Lab Parfumo',0,null),
('THM30','1000 Thousand TRY ME!','EDP','30 ml.','THM-30 ml','Lab Parfumo',0,null),
('AQM30','Aqua TRY ME!','EDP','30 ml.','AQM-30 ml','Lab Parfumo',0,null),
('AMM30','Argentum TRY ME!','EDP','30 ml.','AMM-30 ml','Lab Parfumo',0,null),
('ATM30','Atlantis TRY ME!','EDP','30 ml.','ATM-30 ml','Lab Parfumo',0,null),
('BYM30','Beyond TRY ME!','EDP','30 ml.','BYM-30 ml','Lab Parfumo',0,null),
('BMM30','Blind Magnolia TRY ME!','EDP','30 ml.','BMM-30 ml','Lab Parfumo',0,null),
('BUM30','Buoyant TRY ME!','EDP','30 ml.','BUM-30 ml','Lab Parfumo',0,null),
('CDM30','Cherry Dance TRY ME!','EDP','30 ml.','CDM-30 ml','Lab Parfumo',0,null),
('CGM30','Cocoa Gourmet TRY ME!','EDP','30 ml.','CGM-30 ml','Lab Parfumo',0,null),
('CRM30','Code Red TRY ME!','EDP','30 ml.','CRM-30 ml','Lab Parfumo',0,null),
('DIM30','Dream Island TRY ME!','EDP','30 ml.','DIM-30 ml','Lab Parfumo',0,null),
('DYM30','Dynasty TRY ME!','EDP','30 ml.','DYM-30 ml','Lab Parfumo',0,null),
('EDM30','Eden TRY ME!','EDP','30 ml.','EDM-30 ml','Lab Parfumo',0,null),
('EXM30','Excalibur (EDP) TRY ME!','EDP','30 ml.','EXM-30 ml','Lab Parfumo',0,null),
('FPM30','Found Peony TRY ME!','EDP','30 ml.','FPM-30 ml','Lab Parfumo',0,null),
('GER30','Gentle Elixir TRY ME!','EDP','30 ml.','GEM-30 ml','Lab Parfumo',0,null),
('HEM30','Hercules TRY ME!','EDP','30 ml.','HEM-30 ml','Lab Parfumo',0,null),
('LBM30','La Belle TRY ME!','EDP','30 ml.','LBM-30 ml','Lab Parfumo',0,null),
('LEM30','Legendary TRY ME!','EDP','30 ml.','LEM-30 ml','Lab Parfumo',0,null),
('MWM30','Make Way TRY ME!','EDP','30 ml.','MWM-30 ml','Lab Parfumo',0,null),
('MLM30','Moon Light TRY ME!','EDP','30 ml.','MLM-30 ml','Lab Parfumo',0,null),
('NBM30','Never Blue TRY ME!','EDP','30 ml.','NBM-30 ml','Lab Parfumo',0,null),
('PPM30','Perfect Pear TRY ME!','EDP','30 ml.','PPM-30 ml','Lab Parfumo',0,null),
('PEM30','Persist TRY ME!','EDP','30 ml.','PEM-30 ml','Lab Parfumo',0,null),
('SPM30','Secret of Peach TRY ME!','EDP','30 ml.','SPM-30 ml','Lab Parfumo',0,null),
('SEM30','Senorita TRY ME!','EDP','30 ml.','SEM-30 ml','Lab Parfumo',0,null),
('SLM30','Shadow De Bacci Light TRY ME!','EDP','30 ml.','SLM-30 ml','Lab Parfumo',0,null),
('SIM30','Sicilia TRY ME!','EDP','30 ml.','SIM-30 ml','Lab Parfumo',0,null),
('SOM30','Soir TRY ME!','EDP','30 ml.','SOM-30 ml','Lab Parfumo',0,null),
('TEM30','Teenage Dream TRY ME!','EDP','30 ml.','TEM-30 ml','Lab Parfumo',0,null),
('VOM30','Velvet Oud TRY ME!','EDP','30 ml.','VOM-30 ml','Lab Parfumo',0,null),
('VYM30','Victory TRY ME!','EDP','30 ml.','VYM-30 ml','Lab Parfumo',0,null),
('VEM30','Vintage TRY ME!','EDP','30 ml.','VEM-30 ml','Lab Parfumo',0,null),
('VXM30','Virgin X TRY ME!','EDP','30 ml.','VXM-30 ml','Lab Parfumo',0,null),
('VIM30','Vivid TRY ME!','EDP','30 ml.','VIM-30 ml','Lab Parfumo',0,null),
('VGM30','Voyage TRY ME!','EDP','30 ml.','VGM-30 ml','Lab Parfumo',0,null),
('ZEM30','Zeus TRY ME!','EDP','30 ml.','ZEM-30 ml','Lab Parfumo',0,null),
('ASM30','Amber Spangle TRY ME!','EDP+','30 ml.','ASM-30 ml','Lab Parfumo',0,null),
('BBM30','Blackest Black TRY ME!','EDP+','30 ml.','BBM-30 ml','Lab Parfumo',0,null),
('DXM30','Dionysus X TRY ME!','EDP+','30 ml.','DXM-30 ml','Lab Parfumo',0,null),
('IMM30','Impression TRY ME!','EDP+','30 ml.','IMM-30 ml','Lab Parfumo',0,null),
('LOM30','Legend of Oud TRY ME!','EDP+','30 ml.','LOM-30 ml','Lab Parfumo',0,null),
('LSM30','Luscious Santal TRY ME!','EDP+','30 ml.','LSM-30 ml','Lab Parfumo',0,null),
('PAM30','Patchouli Absolute TRY ME!','EDP+','30 ml.','PAM-30 ml','Lab Parfumo',0,null),
('ROM30','Rose Oud TRY ME!','EDP+','30 ml.','ROM-30 ml','Lab Parfumo',0,null),
('SMM30','Sparkling Mandarin TRY ME!','EDP+','30 ml.','SMM-30 ml','Lab Parfumo',0,null),
('TLM30','Tropical Leather TRY ME!','EDP+','30 ml.','TLM-30 ml','Lab Parfumo',0,null),
('VAM30','Vandal TRY ME!','EDP+','30 ml.','VAM-30 ml','Lab Parfumo',0,null),
('WEM30','Wealth TRY ME!','EDP+','30 ml.','WEM-30 ml','Lab Parfumo',0,null),
('GAM30','Gambling34+35 TRY ME!','PARFUM','30 ml.','GAM-30 ml','Lab Parfumo',0,null),
('QUM30','Queen TRY ME!','PARFUM','30 ml.','QUM-30 ml','Lab Parfumo',0,null),
('SAM30','Savoury TRY ME!','PARFUM','30 ml.','SAM-30 ml','Lab Parfumo',0,null),
('WHM30','What TRY ME!','PARFUM','30 ml.','WHM-30 ml','Lab Parfumo',0,null),
('8857128012134','ถุงกระดาษ Size M','Bag','Size M','BAG-M','Lab Parfumo',0,null),
('8857128012133','ถุงกระดาษ Size S','Bag','Size S','BAG-S','Lab Parfumo',0,null),
('8857128012130','Tumbler CYOC (White)','Tumbler','White','TUM-W','Lab Parfumo',0,null),
('8857128012131','Tumbler CYOC (Dark Blue)','Tumbler','Dark Blue','TUM-DB','Lab Parfumo',0,null),
('8857128012132','Cloth BAG CYOC','Cloth','Size M','CLO-M','Lab Parfumo',0,null),
('8857128011560','Cherry Shade','EDP','50 ml.','CRS-50ml','Lab Parfumo',1890,null),
('8857128012153','Cherry Shade','EDP','30 ml.','CRS-30ml','Lab Parfumo',1290,null),
('8857128012154','Cherry Shade','EDP','10 ml.','CRS-10ml','Lab Parfumo',450,null),
('8857128012155','Cherry Shade','EDP','4 ml.','CRS-4ml','Lab Parfumo',179,null),
('8857128011584','Passion','EDP','50 ml.','PSS-50ml','Lab Parfumo',1890,null),
('8857128012156','Passion','EDP','30 ml.','PSS-30ml','Lab Parfumo',1290,null),
('8857128012157','Passion','EDP','10 ml.','PSS-10ml','Lab Parfumo',450,null),
('8857128012158','Passion','EDP','4 ml.','PSS-4ml','Lab Parfumo',179,null),
('8857128011621','Rosarine','EDP','50 ml.','ROS-50ml','Lab Parfumo',1890,null),
('8857128012159','Rosarine','EDP','30 ml.','ROS-30ml','Lab Parfumo',1290,null),
('8857128012160','Rosarine','EDP','10 ml.','ROS-10ml','Lab Parfumo',450,null),
('8857128012161','Rosarine','EDP','4 ml.','ROS-4ml','Lab Parfumo',179,null),
('8857128011638','Silver','EDP','50 ml.','SIL-50ml','Lab Parfumo',1890,null),
('8857128012162','Silver','EDP','30 ml.','SIL-30ml','Lab Parfumo',1290,null),
('8857128012163','Silver','EDP','10 ml.','SIL-10ml','Lab Parfumo',450,null),
('8857128012164','Silver','EDP','4 ml.','SIL-4ml','Lab Parfumo',179,null),
('CRS50','Cherry Shade TRY ME!','EDP','50 ml.','CRST-50ml','Lab Parfumo',0,null),
('PSS50','Passion TRY ME!','EDP','50 ml.','PSST-50ml','Lab Parfumo',0,null),
('ROS50','Rosarine TRY ME!','EDP','50 ml.','ROST-50ml','Lab Parfumo',0,null),
('SIL50','Silver TRY ME!','EDP','50 ml.','SILT-50ml','Lab Parfumo',0,null),
('8857128012168','Thai Perfume (น้ำปรุง)','EDT','50 ml.','TPF-50ml','Lab Parfumo',450,null),
('8857128012151','Amber Spangle','EDP+','10 ml.','ASM-10 ml','Lab Parfumo',650,null),
('8857128011577','Angel','EDP','50 ml.','AGM-50ml','Lab Parfumo',1890,null),
('8857128012165','Angel','EDP','30 ml.','AGM-30ml','Lab Parfumo',1290,null),
('8857128012166','Angel','EDP','10 ml.','AGM-10ml','Lab Parfumo',450,null),
('8857128012167','Angel','EDP','4 ml.','AGM-4ml','Lab Parfumo',179,null),
('AGM50','Angel TRY ME!','EDP','50 ml.','AGT-50ml','Lab Parfumo',0,null),
('8857128011829','Fortuna','EDP','50 ml.','FOM-50ml','Lab Parfumo',1890,null),
('8857128012172','Fortuna','EDP','30 ml.','FOM-30ml','Lab Parfumo',1290,null),
('8857128012173','Fortuna','EDP','10 ml.','FOM-10ml','Lab Parfumo',450,null),
('8857128012174','Fortuna','EDP','4 ml.','FOM-4ml','Lab Parfumo',179,null),
('FOM50','Fortuna TRY ME!','EDP','50 ml.','FOR-50ml','Lab Parfumo',0,null),
('8857128011799','Nouveau','EDP','50 ml.','NOM-50ml','Lab Parfumo',1890,null),
('8857128012169','Nouveau','EDP','30 ml.','NOM-30ml','Lab Parfumo',1290,null),
('8857128012170','Nouveau','EDP','10 ml.','NOM-10ml','Lab Parfumo',450,null),
('8857128012171','Nouveau','EDP','4 ml.','NOM-4ml','Lab Parfumo',179,null),
('NOM50','Nouveau TRY ME!','EDP','50 ml.','NOU-50ml','Lab Parfumo',0,null),
('MEM50','Mellow TRY ME!','EDP','50 ml.','MEM-50ml','Lab Parfumo',0,null);

-- purchase_orders (76)
insert into purchase_orders (po_number,version,order_date,branch_label,store_no,delivery_number,phone,shipping_name,address,remark) values
('WPO251120001','WPO251120001-2','2025-11-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WPO251120002','WPO251120002-2','2025-11-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WPO251120003','WPO251120003-2','2025-11-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WPO251120004','WPO251120004-2','2025-11-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WPO251124001','WPO251124001-1','2025-11-24','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WPO251120005','WPO251120005-2','2025-11-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0251203001','WP0251203001-1','2025-12-03','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0251220001','WP0251220001-1','2025-12-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0251223001','WP0251223001-1','2025-12-23','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0251230001','WP0251230001-1','2025-12-30','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260103001','WP0260103001-1','2026-01-03','01_CTW - Central World',null,null,null,null,null,null),
('WP0260113001','WP0260113001-1','2026-01-13','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260116001','WP0260116001-1','2026-01-16','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260124001','WP0260124001-1','2026-01-24','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260203001','WP0260203001-1','2026-02-03','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260207001','WP0260207001-1','2026-02-07','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260213001','WP0260213001-1','2026-02-13','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260218001','WP0260218001-1','2026-02-18','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260220001','WP0260220001-1','2026-02-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260228001','WP0260228001-1','2026-02-28','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260304001','WP0260304001-1','2026-03-04','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260305001','WP0260305001-1','2026-03-05','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260313001','WP0260313001-1','2026-03-13','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260313002','WP0260313002-1','2026-03-13','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260320001','WP0260320001-1','2026-03-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260320002','WP0260320002-1','2026-03-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260325001','WP0260325001-1','2026-03-25','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260328001','WP0260328001-1','2026-03-28','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260402001','WP0260402001-1','2026-04-02','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260406001','WP0260406001-1','2026-04-06','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260406002','WP0260406002-1','2026-04-06','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260410001','WP0260410001-1','2026-04-10','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260411001','WP0260411001-1','2026-04-11','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260417001','WP0260417001-1','2026-04-17','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260421001','WP0260421001-1','2026-04-21','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260422001','WP0260422001-1','2026-04-22','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260427001','WP0260427001-1','2026-04-27','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260430001','WP0260430001-1','2026-04-30','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260505001','WP0260505001-1','2026-05-05','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260506001','WP0260506001-1','2026-05-06','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260509001','WP0260509001-1','2026-05-09','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260511001','WP0260511001-1','2026-05-11','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260512001','WP0260512001-1','2026-05-12','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260515001','WP0260515001-1','2026-05-15','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260520001','WP0260520001-1','2026-05-20','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260523001','WP0260523001-1','2026-05-23','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260525001','WP0260525001-1','2026-05-25','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260526001','WP0260526001-1','2026-05-26','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260602001','WP0260602001-1','2026-06-02','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260604001','WP0260604001-1','2026-06-04','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260606001','WP0260606001-1','2026-06-06','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260610001','WP0260610001-1','2026-06-10','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260612001','WP0260612001-1','2026-06-11','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260617001','WP0260617001-1','2026-06-17','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260622001','WP0260622001-1','2026-06-22','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260624001','WP0260624001-1','2026-06-24','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260625001','WP0260625001-1','2026-06-25','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260629001','WP0260629001-1','2026-06-29','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260702001','WP0260702001-2','2026-07-02','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260706001','WP0260706001-1','2026-07-06','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260707001','WP0260707001-1','2026-07-07','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260707002','WP0260707002-2','2026-07-07','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260707003','WP0260707003-1','2026-07-07','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260709001','WP0260709001-1','2026-07-09','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260709002','WP0260709002-1','2026-07-09','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260709003','WP0260709003-1','2026-07-09','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260711001','WP0260711001-1','2026-07-11','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260713001','WP0260713001-1','2026-07-13','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260715001','WP0260715001-1','2026-07-15','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260716002','WP0260716002-1','2026-07-16','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260717001','WP0260717001-1','2026-07-17','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260719001','WP0260719001-1','2026-07-19','02_SCS-Seacon Squar Srinakarin','Event',null,null,null,null,null),
('WP0260721001','WP0260721001-1','2026-07-21','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260724001','WP0260724001-1','2026-07-24','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260729001','WP0260729001-1','2026-07-29','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null),
('WP0260731001','WP0260731001-1','2026-07-31','01_CTW - Central World','สาขาที่ 00001',null,null,null,null,null);

-- po_items (1094) — po_id resolved from purchase_orders
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1,'8857128011188','1000 Thousand','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,2,'8857128011669','Blackest Black','50 ml.',2 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,3,'8857128011225','Blind Magnolia','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,4,'8857128012021','Buoyant','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,5,'8857128011331','Dionysus X','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,6,'8857128011300','Dream Island','50 ml.',20 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,7,'8857128011317','Eden','50 ml.',10 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,8,'8857128011133','Excalibur (EDP)','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,9,'8857128011591','Gambling34+35','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,10,'8857128011287','Never Blue','50 ml.',20 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,11,'8857128011119','Secret of Peach','50 ml.',20 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,12,'8857128011171','Senorita','50 ml.',20 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,13,'8857128011294','Shadow De Bacci Light','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,14,'8857128011140','Sicilia','50 ml.',10 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,15,'8857128011713','Sparkling Mandarin','50 ml.',2 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,16,'8857128011096','Teenage Dream','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,17,'8857128011522','Velvet Oud','50 ml.',10 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,18,'8857128011256','Virgin X','50 ml.',10 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,19,'8857128011072','Beyond','50 ml.',10 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,20,'8857128011010','Dynasty','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,21,'8857128011034','Hercules','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,22,'8857128011058','La Belle','50 ml.',20 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,23,'8857128011041','Persist','50 ml.',10 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,24,'8857128011164','Victory','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,25,'8857128011065','Vivid','50 ml.',10 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,26,'8857128011027','Zeus','50 ml.',20 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,27,'8857128012019','Voyage','50 ml.',10 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,28,'8857128012018','Aqua','50 ml.',15 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,29,'8857128012020','Make Way','50 ml.',5 from purchase_orders where po_number='WPO251120001' and coalesce(version,'')='WPO251120001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,30,'8857128012050','1000 Thousand','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,31,'8857128012005','Blackest Black','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,32,'8857128012064','Blind Magnolia','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,33,'8857128012025','Buoyant','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,34,'8857128012086','Dionysus X','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,35,'8857128011874','Dream Island','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,36,'8857128012057','Eden','30 ml.',8 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,37,'8857128011935','Excalibur (EDP)','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,38,'8857128011836','Never Blue','30 ml.',9 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,39,'8857128011850','Secret of Peach','30 ml.',9 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,40,'8857128011967',null,null,10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,41,'8857128011911','Sicilia','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,42,'8857128012010','Sparkling Mandarin','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,43,'8857128012069','Teenage Dream','30 ml.',4 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,44,'8857128012048','Velvet Oud','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,45,'8857128011997','Virgin X','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,46,'8857128012031','Beyond','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,47,'8857128011812','Dynasty','30 ml.',2 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,48,'8857128011737','Hercules','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,49,'8857128011904','La Belle','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,50,'8857128011881','Persist','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,51,'8857128011430','Victory','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,52,'8857128011898','Vivid','30 ml.',7 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,53,'8857128011843','Zeus','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,54,'8857128012023','Voyage','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,55,'8857128012022','Aqua','30 ml.',10 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,56,'8857128012024','Make Way','30 ml.',5 from purchase_orders where po_number='WPO251120002' and coalesce(version,'')='WPO251120002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,57,'8857128012051','1000 Thousand','10 ml.',9 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,58,'8857128012065','Blind Magnolia','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,59,'8857128012077','Buoyant','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,60,'8857128012087','Dionysus X','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,61,'8857128012030','Dream Island','10 ml.',30 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,62,'8857128012058','Eden','10 ml.',15 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,63,'8857128012062','Excalibur (EDP)','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,64,'8857128012035','Never Blue','10 ml.',30 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,65,'8857128012037','Secret of Peach','10 ml.',20 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,66,'8857128012039','Senorita','10 ml.',30 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,67,'8857128012093','Shadow De Bacci Light','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,68,'8857128012055','Sicilia','10 ml.',20 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,69,'8857128012070','Teenage Dream','10 ml.',8 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,70,'8857128012047','Velvet Oud','10 ml.',20 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,71,'8857128012053','Virgin X','10 ml.',20 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,72,'8857128012032','Beyond','10 ml.',15 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,73,'8857128012128','Dynasty','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,74,'8857128011744','Hercules','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,75,'8857128012034','La Belle','10 ml.',20 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,76,'8857128012042','Persist','10 ml.',15 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,77,'8857128011263','Victory','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,78,'8857128012060','Vivid','10 ml.',10 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,79,'8857128012041','Zeus','10 ml.',20 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,80,'8857128012027','Voyage','10 ml.',20 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,81,'8857128012026','Aqua','10 ml.',30 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,82,'8857128012028','Make Way','10 ml.',20 from purchase_orders where po_number='WPO251120003' and coalesce(version,'')='WPO251120003-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,83,'8857128012016','La Belle','4 ml.',10 from purchase_orders where po_number='WPO251120004' and coalesce(version,'')='WPO251120004-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,84,'8857128012040','Senorita','4 ml.',10 from purchase_orders where po_number='WPO251120004' and coalesce(version,'')='WPO251120004-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,85,'8857128012078','Buoyant','4 ml.',10 from purchase_orders where po_number='WPO251120004' and coalesce(version,'')='WPO251120004-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,86,'8857128012036','Never Blue','4 ml.',10 from purchase_orders where po_number='WPO251120004' and coalesce(version,'')='WPO251120004-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,87,'8857128012056','Sicilia','4 ml.',10 from purchase_orders where po_number='WPO251120004' and coalesce(version,'')='WPO251120004-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,88,'8857128011683','Legend of Oud','50 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,89,'8857128011690','Luscious Santal','50 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,90,'8857128011713','Sparkling Mandarin','50 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,91,'8857128011720','Tropical Leather','50 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,92,'8857128011607','Queen','50 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,93,'8857128011614','Savoury','50 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,94,'8857128012007','Legend of Oud','30 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,95,'8857128012008','Luscious Santal','30 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,96,'8857128012011','Tropical Leather','30 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,97,'8857128012001','Queen','30 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,98,'8857128012002','Savoury','30 ml.',3 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,99,'8857128012101','Blackest Black','10 ml.',10 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,100,'8857128012110','Legend of Oud','10 ml.',10 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,101,'8857128012122','Luscious Santal','10 ml.',10 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,102,'8857128012108','Sparkling Mandarin','10 ml.',10 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,103,'8857128012112','Tropical Leather','10 ml.',10 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,104,'8857128012103','Gambling34+35','10 ml.',10 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,105,'8857128012116','Queen','10 ml.',10 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,106,'8857128012118','Savoury','10 ml.',10 from purchase_orders where po_number='WPO251124001' and coalesce(version,'')='WPO251124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,107,'8857128012130','Tumbler CYOC (White)','White',6 from purchase_orders where po_number='WPO251120005' and coalesce(version,'')='WPO251120005-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,108,'8857128012131','Tumbler CYOC (Dark Blue)','Dark Blue',6 from purchase_orders where po_number='WPO251120005' and coalesce(version,'')='WPO251120005-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,109,'8857128012132','Cloth BAG CYOC','Size M',20 from purchase_orders where po_number='WPO251120005' and coalesce(version,'')='WPO251120005-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,110,'8857128012130','Tumbler CYOC (White)','White',3 from purchase_orders where po_number='WP0251203001' and coalesce(version,'')='WP0251203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,111,'8857128012131','Tumbler CYOC (Dark Blue)','Dark Blue',3 from purchase_orders where po_number='WP0251203001' and coalesce(version,'')='WP0251203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,112,'8857128012130','Tumbler CYOC (White)','White',10 from purchase_orders where po_number='WP0251220001' and coalesce(version,'')='WP0251220001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,113,'8857128011669','Blackest Black','50 ml.',2 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,114,'8857128011904','La Belle','30 ml.',8 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,115,'8857128012034','La Belle','10 ml.',5 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,116,'8857128012055','Sicilia','10 ml.',10 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,117,'8857128012037','Secret of Peach','10 ml.',20 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,118,'8857128012038','Secret of Peach','4 ml.',10 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,119,'8857128012044','Aqua','4 ml.',10 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,120,'8857128012015','Dream Island','4 ml.',10 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,121,'8857128012043','Persist','4 ml.',10 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,122,'8857128012130','Tumbler CYOC (White)','White',4 from purchase_orders where po_number='WP0251223001' and coalesce(version,'')='WP0251223001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,123,'8857128012140','Gentle Elixir','50 ml.',5 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,124,'8857128012144','Soir','50 ml.',5 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,125,'8857128012141','Gentle Elixir','30 ml.',5 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,126,'8857128012145','Soir','30 ml.',5 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,127,'GER50','Gentle Elixir TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,128,'SOM50','Soir TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,129,'SEM50','Senorita TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,130,'8857128012130','Tumbler CYOC (White)','White',10 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,131,'8857128012132','Cloth BAG CYOC','Size M',20 from purchase_orders where po_number='WP0251230001' and coalesce(version,'')='WP0251230001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,132,'8857128012130','Tumbler CYOC (White)','White',6 from purchase_orders where po_number='WP0260103001' and coalesce(version,'')='WP0260103001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,133,'8857128012132','Cloth BAG CYOC','Size M',10 from purchase_orders where po_number='WP0260103001' and coalesce(version,'')='WP0260103001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,134,'8857128012017','Zeus','4 ml.',10 from purchase_orders where po_number='WP0260103001' and coalesce(version,'')='WP0260103001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,135,'8857128012016','La Belle','4 ml.',10 from purchase_orders where po_number='WP0260103001' and coalesce(version,'')='WP0260103001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,136,'8857128012071','Teenage Dream','4 ml.',10 from purchase_orders where po_number='WP0260103001' and coalesce(version,'')='WP0260103001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,137,'8857128012033','Beyond','4 ml.',10 from purchase_orders where po_number='WP0260103001' and coalesce(version,'')='WP0260103001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,138,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260103001' and coalesce(version,'')='WP0260103001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,139,'8857128012018','Aqua','50 ml.',5 from purchase_orders where po_number='WP0260113001' and coalesce(version,'')='WP0260113001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,140,'8857128011669','Blackest Black','50 ml.',2 from purchase_orders where po_number='WP0260113001' and coalesce(version,'')='WP0260113001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,141,'8857128011683','Legend of Oud','50 ml.',2 from purchase_orders where po_number='WP0260113001' and coalesce(version,'')='WP0260113001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,142,'8857128012007','Legend of Oud','30 ml.',2 from purchase_orders where po_number='WP0260113001' and coalesce(version,'')='WP0260113001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,143,'8857128011607','Queen','50 ml.',2 from purchase_orders where po_number='WP0260113001' and coalesce(version,'')='WP0260113001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,144,'8857128011713','Sparkling Mandarin','50 ml.',2 from purchase_orders where po_number='WP0260113001' and coalesce(version,'')='WP0260113001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,145,'8857128012030','Dream Island','10 ml.',10 from purchase_orders where po_number='WP0260113001' and coalesce(version,'')='WP0260113001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,146,'8857128012034','La Belle','10 ml.',10 from purchase_orders where po_number='WP0260113001' and coalesce(version,'')='WP0260113001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,147,'8857128011874','Dream Island','30 ml.',10 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,148,'8857128011591','Gambling34+35','50 ml.',2 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,149,'8857128011614','Savoury','50 ml.',2 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,150,'8857128012108','Sparkling Mandarin','10 ml.',10 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,151,'8857128012035','Never Blue','10 ml.',10 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,152,'8857128011836','Never Blue','30 ml.',5 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,153,'8857128012020','Make Way','50 ml.',5 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,154,'8857128012130','Tumbler CYOC (White)','White',3 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,155,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,156,'8857128011812','Dynasty','30 ml.',5 from purchase_orders where po_number='WP0260116001' and coalesce(version,'')='WP0260116001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,157,'8857128011904','La Belle','30 ml.',3 from purchase_orders where po_number='WP0260124001' and coalesce(version,'')='WP0260124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,158,'8857128011850','Secret of Peach','30 ml.',7 from purchase_orders where po_number='WP0260124001' and coalesce(version,'')='WP0260124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,159,'8857128012069','Teenage Dream','30 ml.',2 from purchase_orders where po_number='WP0260124001' and coalesce(version,'')='WP0260124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,160,'8857128011430','Victory','30 ml.',2 from purchase_orders where po_number='WP0260124001' and coalesce(version,'')='WP0260124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,161,'8857128011317','Eden','50 ml.',5 from purchase_orders where po_number='WP0260124001' and coalesce(version,'')='WP0260124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,162,'8857128011164','Victory','50 ml.',3 from purchase_orders where po_number='WP0260124001' and coalesce(version,'')='WP0260124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,163,'8857128012130','Tumbler CYOC (White)','White',2 from purchase_orders where po_number='WP0260124001' and coalesce(version,'')='WP0260124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,164,'8857128011967',null,null,5 from purchase_orders where po_number='WP0260124001' and coalesce(version,'')='WP0260124001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,165,'8857128011058','La Belle','50 ml.',10 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,166,'8857128012034','La Belle','10 ml.',10 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,167,'8857128011164','Victory','50 ml.',5 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,168,'8857128011263','Victory','10 ml.',10 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,169,'8857128011287','Never Blue','50 ml.',10 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,170,'8857128012066','Blind Magnolia','4 ml.',10 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,171,'8857128012063','Excalibur (EDP)','4 ml.',10 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,172,'8857128012054','Virgin X','4 ml.',10 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,173,'8857128012061','Vivid','4 ml.',10 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,174,'8857128012134','ถุงกระดาษ Size M','Size M',80 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,175,'8857128011430','Victory','30 ml.',5 from purchase_orders where po_number='WP0260203001' and coalesce(version,'')='WP0260203001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,176,'8857128011867','Senorita','30 ml.',5 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,177,'8857128012039','Senorita','10 ml.',10 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,178,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,179,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,180,'8857128012145','Soir','30 ml.',5 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,181,'8857128012146','Soir','10 ml.',10 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,182,'8857128012141','Gentle Elixir','30 ml.',5 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,183,'8857128012142','Gentle Elixir','10 ml.',10 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,184,'8857128012070','Teenage Dream','10 ml.',5 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,185,'8857128012101','Blackest Black','10 ml.',5 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,186,'DIM50','Dream Island TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,187,'EDM50','Eden TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,188,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,189,'SEM50','Senorita TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260207001' and coalesce(version,'')='WP0260207001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,190,'8857128011560','Cherry Shade','50 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,191,'8857128012153','Cherry Shade','30 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,192,'8857128011584','Passion','50 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,193,'8857128012156','Passion','30 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,194,'8857128011621','Rosarine','50 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,195,'8857128012159','Rosarine','30 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,196,'8857128011638','Silver','50 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,197,'8857128012162','Silver','30 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,198,'CRS50','Cherry Shade TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,199,'PSS50','Passion TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,200,'ROS50','Rosarine TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,201,'SIL50','Silver TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,202,'DIM50','Dream Island TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,203,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,204,'VYM50','Victory TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,205,'EDM50','Eden TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,206,'SEM50','Senorita TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,207,'8857128012061','Vivid','4 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,208,'8857128012056','Sicilia','4 ml.',10 from purchase_orders where po_number='WP0260213001' and coalesce(version,'')='WP0260213001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,209,'8857128012154','Cherry Shade','10 ml.',5 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,210,'8857128012157','Passion','10 ml.',5 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,211,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,212,'8857128012163','Silver','10 ml.',5 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,213,'8857128012030','Dream Island','10 ml.',10 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,214,'8857128012058','Eden','10 ml.',5 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,215,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,216,'8857128012108','Sparkling Mandarin','10 ml.',5 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,217,'8857128012066','Blind Magnolia','4 ml.',15 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,218,'8857128012056','Sicilia','4 ml.',10 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,219,'8857128012150','Mellow','4 ml.',15 from purchase_orders where po_number='WP0260218001' and coalesce(version,'')='WP0260218001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,220,'8857128012033','Beyond','4 ml.',10 from purchase_orders where po_number='WP0260220001' and coalesce(version,'')='WP0260220001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,221,'8857128012040','Senorita','4 ml.',10 from purchase_orders where po_number='WP0260220001' and coalesce(version,'')='WP0260220001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,222,'8857128012071','Teenage Dream','4 ml.',10 from purchase_orders where po_number='WP0260220001' and coalesce(version,'')='WP0260220001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,223,'8857128012054','Virgin X','4 ml.',10 from purchase_orders where po_number='WP0260220001' and coalesce(version,'')='WP0260220001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,224,'8857128012160','Rosarine','10 ml.',10 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,225,'8857128012077','Buoyant','10 ml.',5 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,226,'8857128012062','Excalibur (EDP)','10 ml.',5 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,227,'8857128012053','Virgin X','10 ml.',5 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,228,'8857128011874','Dream Island','30 ml.',5 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,229,'8857128011904','La Belle','30 ml.',5 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,230,'8857128011591','Gambling34+35','50 ml.',3 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,231,'8857128011621','Rosarine','50 ml.',0 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,232,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260228001' and coalesce(version,'')='WP0260228001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,233,'8857128011171','Senorita','50 ml.',5 from purchase_orders where po_number='WP0260304001' and coalesce(version,'')='WP0260304001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,234,'8857128012039','Senorita','10 ml.',10 from purchase_orders where po_number='WP0260304001' and coalesce(version,'')='WP0260304001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,235,'8857128011119','Secret of Peach','50 ml.',5 from purchase_orders where po_number='WP0260304001' and coalesce(version,'')='WP0260304001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,236,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260304001' and coalesce(version,'')='WP0260304001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,237,'8857128011300','Dream Island','50 ml.',5 from purchase_orders where po_number='WP0260304001' and coalesce(version,'')='WP0260304001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,238,'8857128012047','Velvet Oud','10 ml.',5 from purchase_orders where po_number='WP0260304001' and coalesce(version,'')='WP0260304001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,239,'VGM50','Voyage TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,240,'NBM50','Never Blue TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,241,'LBM50','La Belle TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,242,'ZEM50','Zeus TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,243,'VOM50','Velvet Oud TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,244,'VXM50','Virgin X TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,245,'VIM50','Vivid TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,246,'GAM50','Gambling34+35 TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,247,'SMM50','Sparkling Mandarin TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260305001' and coalesce(version,'')='WP0260305001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,248,'8857128012039','Senorita','10 ml.',10 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,249,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,250,'8857128012160','Rosarine','10 ml.',10 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,251,'8857128012062','Excalibur (EDP)','10 ml.',5 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,252,'8857128012030','Dream Island','10 ml.',10 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,253,'8857128012032','Beyond','10 ml.',5 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,254,'8857128012159','Rosarine','30 ml.',5 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,255,'8857128011621','Rosarine','50 ml.',5 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,256,'8857128012048','Velvet Oud','30 ml.',5 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,257,'8857128011713','Sparkling Mandarin','50 ml.',2 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,258,'8857128011669','Blackest Black','50 ml.',2 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,259,'8857128012047','Velvet Oud','10 ml.',5 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,260,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,261,'8857128012005','Blackest Black','30 ml.',2 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,262,'8857128012154','Cherry Shade','10 ml.',10 from purchase_orders where po_number='WP0260313001' and coalesce(version,'')='WP0260313001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,263,'SEM50','Senorita TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260313002' and coalesce(version,'')='WP0260313002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,264,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260313002' and coalesce(version,'')='WP0260313002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,265,'8857128012018','Aqua','50 ml.',2 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,266,'8857128012022','Aqua','30 ml.',5 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,267,'8857128011133','Excalibur (EDP)','50 ml.',2 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,268,'8857128012062','Excalibur (EDP)','10 ml.',5 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,269,'8857128011119','Secret of Peach','50 ml.',5 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,270,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,271,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,272,'8857128011171','Senorita','50 ml.',5 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,273,'8857128012039','Senorita','10 ml.',10 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,274,'8857128011300','Dream Island','50 ml.',5 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,275,'8857128011058','La Belle','50 ml.',5 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,276,'8857128012034','La Belle','10 ml.',5 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,277,'8857128012016','La Belle','4 ml.',10 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,278,'8857128011041','Persist','50 ml.',2 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,279,'8857128011690','Luscious Santal','50 ml.',1 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,280,'8857128012001','Queen','30 ml.',3 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,281,'8857128012002','Savoury','30 ml.',1 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,282,'8857128012005','Blackest Black','30 ml.',2 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,283,'8857128012054','Virgin X','4 ml.',10 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,284,'8857128012017','Zeus','4 ml.',10 from purchase_orders where po_number='WP0260320001' and coalesce(version,'')='WP0260320001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,285,'DIM50','Dream Island TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260320002' and coalesce(version,'')='WP0260320002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,286,'MWM50','Make Way TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260320002' and coalesce(version,'')='WP0260320002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,287,'EXM50','Excalibur (EDP) TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260320002' and coalesce(version,'')='WP0260320002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,288,'BYM50','Beyond TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260320002' and coalesce(version,'')='WP0260320002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,289,'AQM50','Aqua TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260320002' and coalesce(version,'')='WP0260320002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,290,'VYM50','Victory TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260320002' and coalesce(version,'')='WP0260320002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,291,'TEM50','Teenage Dream TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260320002' and coalesce(version,'')='WP0260320002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,292,'ROS50','Rosarine TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260320002' and coalesce(version,'')='WP0260320002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,293,'8857128012160','Rosarine','10 ml.',10 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,294,'8857128012157','Passion','10 ml.',10 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,295,'8857128012103','Gambling34+35','10 ml.',5 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,296,'8857128012001','Queen','30 ml.',2 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,297,'8857128011713','Sparkling Mandarin','50 ml.',2 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,298,'8857128012008','Luscious Santal','30 ml.',1 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,299,'8857128012002','Savoury','30 ml.',1 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,300,'8857128012145','Soir','30 ml.',2 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,301,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,302,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,303,'8857128011836','Never Blue','30 ml.',5 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,304,'8857128011645','What','50 ml.',3 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,305,'8857128012013','What','30 ml.',3 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,306,'8857128012124','What','10 ml.',10 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,307,'8857128011706','Patchouli Absolute','50 ml.',3 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,308,'8857128012009','Patchouli Absolute','30 ml.',3 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,309,'8857128012114','Patchouli Absolute','10 ml.',10 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,310,'WHM50','What TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,311,'PAM50','Patchouli Absolute TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260325001' and coalesce(version,'')='WP0260325001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,312,'8857128012163','Silver','10 ml.',3 from purchase_orders where po_number='WP0260328001' and coalesce(version,'')='WP0260328001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,313,'8857128011263','Victory','10 ml.',5 from purchase_orders where po_number='WP0260328001' and coalesce(version,'')='WP0260328001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,314,'8857128012047','Velvet Oud','10 ml.',5 from purchase_orders where po_number='WP0260328001' and coalesce(version,'')='WP0260328001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,315,'8857128012101','Blackest Black','10 ml.',5 from purchase_orders where po_number='WP0260328001' and coalesce(version,'')='WP0260328001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,316,'8857128012110','Legend of Oud','10 ml.',3 from purchase_orders where po_number='WP0260328001' and coalesce(version,'')='WP0260328001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,317,'8857128012116','Queen','10 ml.',3 from purchase_orders where po_number='WP0260328001' and coalesce(version,'')='WP0260328001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,318,'8857128012032','Beyond','10 ml.',10 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,319,'8857128012077','Buoyant','10 ml.',5 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,320,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,321,'8857128012028','Make Way','10 ml.',5 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,322,'8857128012026','Aqua','10 ml.',5 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,323,'8857128012062','Excalibur (EDP)','10 ml.',5 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,324,'8857128012108','Sparkling Mandarin','10 ml.',5 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,325,'8857128012053','Virgin X','10 ml.',5 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,326,'8857128011119','Secret of Peach','50 ml.',2 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,327,'8857128011522','Velvet Oud','50 ml.',2 from purchase_orders where po_number='WP0260402001' and coalesce(version,'')='WP0260402001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,328,'8857128011522','Velvet Oud','50 ml.',2 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,329,'8857128012144','Soir','50 ml.',3 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,330,'8857128012140','Gentle Elixir','50 ml.',2 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,331,'8857128011133','Excalibur (EDP)','50 ml.',3 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,332,'8857128012019','Voyage','50 ml.',3 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,333,'8857128012021','Buoyant','50 ml.',2 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,334,'8857128011164','Victory','50 ml.',2 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,335,'8857128012023','Voyage','30 ml.',2 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,336,'8857128011935','Excalibur (EDP)','30 ml.',3 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,337,'8857128011867','Senorita','30 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,338,'8857128012010','Sparkling Mandarin','30 ml.',2 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,339,'8857128012060','Vivid','10 ml.',10 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,340,'8857128012041','Zeus','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,341,'8857128012026','Aqua','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,342,'8857128012032','Beyond','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,343,'8857128012077','Buoyant','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,344,'8857128011263','Victory','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,345,'8857128012027','Voyage','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,346,'8857128012030','Dream Island','10 ml.',15 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,347,'8857128012035','Never Blue','10 ml.',10 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,348,'8857128012160','Rosarine','10 ml.',10 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,349,'8857128012154','Cherry Shade','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,350,'8857128012037','Secret of Peach','10 ml.',20 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,351,'8857128012042','Persist','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,352,'8857128012058','Eden','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,353,'8857128012101','Blackest Black','10 ml.',5 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,354,'8857128012024','Make Way','30 ml.',3 from purchase_orders where po_number='WP0260406001' and coalesce(version,'')='WP0260406001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,355,'8857128012168','Thai Perfume (น้ำปรุง)','50 ml.',10 from purchase_orders where po_number='WP0260406002' and coalesce(version,'')='WP0260406002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,356,'8857128012053','Virgin X','10 ml.',5 from purchase_orders where po_number='WP0260406002' and coalesce(version,'')='WP0260406002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,357,'8857128012160','Rosarine','10 ml.',7 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,358,'8857128012070','Teenage Dream','10 ml.',7 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,359,'8857128012163','Silver','10 ml.',3 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,360,'8857128012146','Soir','10 ml.',4 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,361,'8857128012065','Blind Magnolia','10 ml.',2 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,362,'8857128012108','Sparkling Mandarin','10 ml.',3 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,363,'8857128011263','Victory','10 ml.',4 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,364,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,365,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,366,'8857128012159','Rosarine','30 ml.',4 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,367,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,368,'8857128011836','Never Blue','30 ml.',3 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,369,'8857128012069','Teenage Dream','30 ml.',3 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,370,'8857128011843','Zeus','30 ml.',2 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,371,'8857128012025','Buoyant','30 ml.',2 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,372,'8857128012001','Queen','30 ml.',1 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,373,'8857128012005','Blackest Black','30 ml.',1 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,374,'8857128011621','Rosarine','50 ml.',5 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,375,'8857128011287','Never Blue','50 ml.',5 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,376,'8857128011119','Secret of Peach','50 ml.',3 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,377,'8857128011300','Dream Island','50 ml.',3 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,378,'8857128011317','Eden','50 ml.',3 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,379,'8857128012144','Soir','50 ml.',2 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,380,'8857128011027','Zeus','50 ml.',2 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,381,'8857128011041','Persist','50 ml.',2 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,382,'8857128012133','ถุงกระดาษ Size S','Size S',80 from purchase_orders where po_number='WP0260410001' and coalesce(version,'')='WP0260410001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,383,'8857128011034','Hercules','50 ml.',2 from purchase_orders where po_number='WP0260411001' and coalesce(version,'')='WP0260411001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,384,'8857128011737','Hercules','30 ml.',2 from purchase_orders where po_number='WP0260411001' and coalesce(version,'')='WP0260411001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,385,'8857128011744','Hercules','10 ml.',5 from purchase_orders where po_number='WP0260411001' and coalesce(version,'')='WP0260411001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,386,'HEM50','Hercules TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260411001' and coalesce(version,'')='WP0260411001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,387,'8857128012047','Velvet Oud','10 ml.',3 from purchase_orders where po_number='WP0260417001' and coalesce(version,'')='WP0260417001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,388,'8857128012026','Aqua','10 ml.',3 from purchase_orders where po_number='WP0260417001' and coalesce(version,'')='WP0260417001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,389,'8857128012001','Queen','30 ml.',3 from purchase_orders where po_number='WP0260417001' and coalesce(version,'')='WP0260417001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,390,'8857128012005','Blackest Black','30 ml.',2 from purchase_orders where po_number='WP0260417001' and coalesce(version,'')='WP0260417001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,391,'8857128012007','Legend of Oud','30 ml.',2 from purchase_orders where po_number='WP0260417001' and coalesce(version,'')='WP0260417001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,392,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260421001' and coalesce(version,'')='WP0260421001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,393,'8857128012060','Vivid','10 ml.',3 from purchase_orders where po_number='WP0260421001' and coalesce(version,'')='WP0260421001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,394,'8857128012038','Secret of Peach','4 ml.',10 from purchase_orders where po_number='WP0260422001' and coalesce(version,'')='WP0260422001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,395,'8857128012015','Dream Island','4 ml.',10 from purchase_orders where po_number='WP0260422001' and coalesce(version,'')='WP0260422001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,396,'8857128012037','Secret of Peach','10 ml.',15 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,397,'8857128012039','Senorita','10 ml.',10 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,398,'8857128012030','Dream Island','10 ml.',10 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,399,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,400,'8857128012026','Aqua','10 ml.',5 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,401,'8857128012047','Velvet Oud','10 ml.',5 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,402,'8857128012028','Make Way','10 ml.',5 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,403,'8857128012027','Voyage','10 ml.',5 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,404,'8857128012062','Excalibur (EDP)','10 ml.',3 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,405,'8857128012053','Virgin X','10 ml.',5 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,406,'8857128012101','Blackest Black','10 ml.',3 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,407,'8857128012007','Legend of Oud','30 ml.',1 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,408,'8857128012024','Make Way','30 ml.',3 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,409,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,410,'8857128011133','Excalibur (EDP)','50 ml.',3 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,411,'8857128012018','Aqua','50 ml.',3 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,412,'8857128011096','Teenage Dream','50 ml.',3 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,413,'8857128011119','Secret of Peach','50 ml.',5 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,414,'DIM50','Dream Island TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,415,'SEM50','Senorita TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,416,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,417,'LBM50','La Belle TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,418,'PEM50','Persist TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260427001' and coalesce(version,'')='WP0260427001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,419,'8857128012027','Voyage','10 ml.',3 from purchase_orders where po_number='WP0260430001' and coalesce(version,'')='WP0260430001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,420,'8857128012026','Aqua','10 ml.',3 from purchase_orders where po_number='WP0260430001' and coalesce(version,'')='WP0260430001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,421,'8857128012032','Beyond','10 ml.',5 from purchase_orders where po_number='WP0260430001' and coalesce(version,'')='WP0260430001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,422,'8857128012058','Eden','10 ml.',3 from purchase_orders where po_number='WP0260430001' and coalesce(version,'')='WP0260430001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,423,'8857128012157','Passion','10 ml.',3 from purchase_orders where po_number='WP0260430001' and coalesce(version,'')='WP0260430001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,424,'8857128012129','Dynasty','4 ml.',10 from purchase_orders where po_number='WP0260430001' and coalesce(version,'')='WP0260430001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,425,'8857128012059','Eden','4 ml.',10 from purchase_orders where po_number='WP0260430001' and coalesce(version,'')='WP0260430001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,426,'8857128012054','Virgin X','4 ml.',10 from purchase_orders where po_number='WP0260430001' and coalesce(version,'')='WP0260430001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,427,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260505001' and coalesce(version,'')='WP0260505001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,428,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260505001' and coalesce(version,'')='WP0260505001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,429,'8857128012026','Aqua','10 ml.',5 from purchase_orders where po_number='WP0260505001' and coalesce(version,'')='WP0260505001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,430,'8857128011744','Hercules','10 ml.',2 from purchase_orders where po_number='WP0260505001' and coalesce(version,'')='WP0260505001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,431,'8857128012019','Voyage','50 ml.',2 from purchase_orders where po_number='WP0260505001' and coalesce(version,'')='WP0260505001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,432,'8857128012122','Luscious Santal','10 ml.',3 from purchase_orders where po_number='WP0260506001' and coalesce(version,'')='WP0260506001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,433,'8857128012133','ถุงกระดาษ Size S','Size S',40 from purchase_orders where po_number='WP0260506001' and coalesce(version,'')='WP0260506001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,434,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,435,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,436,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,437,'8857128012026','Aqua','10 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,438,'8857128012157','Passion','10 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,439,'8857128012163','Silver','10 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,440,'8857128011867','Senorita','30 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,441,'8857128011850','Secret of Peach','30 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,442,'8857128012023','Voyage','30 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,443,'8857128011119','Secret of Peach','50 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,444,'8857128011171','Senorita','50 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,445,'8857128012019','Voyage','50 ml.',3 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,446,'8857128011669','Blackest Black','50 ml.',1 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,447,'8857128011874','Dream Island','30 ml.',2 from purchase_orders where po_number='WP0260509001' and coalesce(version,'')='WP0260509001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,448,'8857128012101','Blackest Black','10 ml.',10 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,449,'8857128012122','Luscious Santal','10 ml.',5 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,450,'8857128012034','La Belle','10 ml.',10 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,451,'8857128012060','Vivid','10 ml.',10 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,452,'8857128012032','Beyond','10 ml.',10 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,453,'8857128012160','Rosarine','10 ml.',10 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,454,'8857128012053','Virgin X','10 ml.',5 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,455,'8857128012154','Cherry Shade','10 ml.',5 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,456,'8857128012042','Persist','10 ml.',5 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,457,'8857128012058','Eden','10 ml.',10 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,458,'QUM50','Queen TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,459,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,460,'VGM50','Voyage TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,461,'CRS50','Cherry Shade TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,462,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,463,'8857128012133','ถุงกระดาษ Size S','Size S',40 from purchase_orders where po_number='WP0260511001' and coalesce(version,'')='WP0260511001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,464,'8857128012030','Dream Island','10 ml.',10 from purchase_orders where po_number='WP0260512001' and coalesce(version,'')='WP0260512001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,465,'8857128012035','Never Blue','10 ml.',10 from purchase_orders where po_number='WP0260512001' and coalesce(version,'')='WP0260512001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,466,'8857128012062','Excalibur (EDP)','10 ml.',5 from purchase_orders where po_number='WP0260512001' and coalesce(version,'')='WP0260512001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,467,'8857128012027','Voyage','10 ml.',5 from purchase_orders where po_number='WP0260512001' and coalesce(version,'')='WP0260512001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,468,'8857128012041','Zeus','10 ml.',5 from purchase_orders where po_number='WP0260512001' and coalesce(version,'')='WP0260512001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,469,'8857128012024','Make Way','30 ml.',5 from purchase_orders where po_number='WP0260512001' and coalesce(version,'')='WP0260512001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,470,'8857128011300','Dream Island','50 ml.',5 from purchase_orders where po_number='WP0260512001' and coalesce(version,'')='WP0260512001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,471,'8857128012116','Queen','10 ml.',5 from purchase_orders where po_number='WP0260515001' and coalesce(version,'')='WP0260515001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,472,'8857128012005','Blackest Black','30 ml.',5 from purchase_orders where po_number='WP0260515001' and coalesce(version,'')='WP0260515001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,473,'8857128012007','Legend of Oud','30 ml.',3 from purchase_orders where po_number='WP0260515001' and coalesce(version,'')='WP0260515001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,474,'8857128012028','Make Way','10 ml.',5 from purchase_orders where po_number='WP0260515001' and coalesce(version,'')='WP0260515001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,475,'8857128011744','Hercules','10 ml.',5 from purchase_orders where po_number='WP0260515001' and coalesce(version,'')='WP0260515001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,476,'8857128012070','Teenage Dream','10 ml.',5 from purchase_orders where po_number='WP0260515001' and coalesce(version,'')='WP0260515001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,477,'8857128012053','Virgin X','10 ml.',5 from purchase_orders where po_number='WP0260515001' and coalesce(version,'')='WP0260515001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,478,'VOM50','Velvet Oud TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260515001' and coalesce(version,'')='WP0260515001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,479,'8857128012030','Dream Island','10 ml.',10 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,480,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,481,'8857128012026','Aqua','10 ml.',10 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,482,'8857128012027','Voyage','10 ml.',5 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,483,'8857128012041','Zeus','10 ml.',5 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,484,'8857128012151','Amber Spangle','10 ml.',5 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,485,'8857128012010','Sparkling Mandarin','30 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,486,'8857128011898','Vivid','30 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,487,'8857128011836','Never Blue','30 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,488,'8857128012153','Cherry Shade','30 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,489,'8857128012159','Rosarine','30 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,490,'8857128011874','Dream Island','30 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,491,'8857128011935','Excalibur (EDP)','30 ml.',5 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,492,'8857128012004','Amber Spangle','30 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,493,'8857128011287','Never Blue','50 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,494,'8857128011621','Rosarine','50 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,495,'8857128011065','Vivid','50 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,496,'8857128012019','Voyage','50 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,497,'8857128011133','Excalibur (EDP)','50 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,498,'8857128011072','Beyond','50 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,499,'8857128011652','Amber Spangle','50 ml.',3 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,500,'ASM50','Amber Spangle TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,501,'8857128012044','Aqua','4 ml.',10 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,502,'8857128012161','Rosarine','4 ml.',10 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,503,'8857128012133','ถุงกระดาษ Size S','Size S',40 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,504,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,505,'8857128012060','Vivid','10 ml.',5 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,506,'8857128012163','Silver','10 ml.',5 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,507,'8857128012154','Cherry Shade','10 ml.',5 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,508,'VOM50','Velvet Oud TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,509,'BMM50','Blind Magnolia TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,510,'BUM50','Buoyant TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,511,'NBM50','Never Blue TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260520001' and coalesce(version,'')='WP0260520001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,512,'8857128011034','Hercules','50 ml.',2 from purchase_orders where po_number='WP0260523001' and coalesce(version,'')='WP0260523001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,513,'8857128012009','Patchouli Absolute','30 ml.',2 from purchase_orders where po_number='WP0260523001' and coalesce(version,'')='WP0260523001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,514,'8857128012151','Amber Spangle','10 ml.',10 from purchase_orders where po_number='WP0260523001' and coalesce(version,'')='WP0260523001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,515,'8857128011577','Angel','50 ml.',5 from purchase_orders where po_number='WP0260523001' and coalesce(version,'')='WP0260523001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,516,'8857128012165','Angel','30 ml.',5 from purchase_orders where po_number='WP0260523001' and coalesce(version,'')='WP0260523001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,517,'8857128012166','Angel','10 ml.',10 from purchase_orders where po_number='WP0260523001' and coalesce(version,'')='WP0260523001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,518,'AGM50','Angel TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260523001' and coalesce(version,'')='WP0260523001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,519,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,520,'8857128012047','Velvet Oud','10 ml.',10 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,521,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,522,'8857128012027','Voyage','10 ml.',5 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,523,'8857128012154','Cherry Shade','10 ml.',5 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,524,'8857128012022','Aqua','30 ml.',2 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,525,'8857128011737','Hercules','30 ml.',2 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,526,'8857128011904','La Belle','30 ml.',3 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,527,'8857128012064','Blind Magnolia','30 ml.',2 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,528,'8857128011638','Silver','50 ml.',3 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,529,'8857128011119','Secret of Peach','50 ml.',10 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,530,'8857128011171','Senorita','50 ml.',5 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,531,'8857128012018','Aqua','50 ml.',5 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,532,'8857128011522','Velvet Oud','50 ml.',3 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,533,'8857128011133','Excalibur (EDP)','50 ml.',3 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,534,'8857128011096','Teenage Dream','50 ml.',2 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,535,'8857128012019','Voyage','50 ml.',5 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,536,'8857128012063','Excalibur (EDP)','4 ml.',15 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,537,'DIM50','Dream Island TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,538,'AQM50','Aqua TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,539,'PSS50','Passion TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,540,'ROS50','Rosarine TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,541,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,542,'LOM50','Legend of Oud TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,543,'TLM50','Tropical Leather TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,544,'BBM50','Blackest Black TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,545,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260525001' and coalesce(version,'')='WP0260525001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,546,'8857128011669','Blackest Black','50 ml.',1 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,547,'8857128011645','What','50 ml.',1 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,548,'8857128012114','Patchouli Absolute','10 ml.',5 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,549,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,550,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,551,'8857128012062','Excalibur (EDP)','10 ml.',3 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,552,'8857128012157','Passion','10 ml.',3 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,553,'8857128012154','Cherry Shade','10 ml.',3 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,554,'8857128012027','Voyage','10 ml.',5 from purchase_orders where po_number='WP0260526001' and coalesce(version,'')='WP0260526001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,555,'8857128012034','La Belle','10 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,556,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,557,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,558,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,559,'8857128012032','Beyond','10 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,560,'8857128012042','Persist','10 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,561,'8857128012079','Vintage','10 ml.',10 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,562,'8857128012166','Angel','10 ml.',4 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,563,'8857128012146','Soir','10 ml.',4 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,564,'8857128012110','Legend of Oud','10 ml.',2 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,565,'8857128012112','Tropical Leather','10 ml.',2 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,566,'8857128012159','Rosarine','30 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,567,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,568,'8857128011867','Senorita','30 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,569,'8857128011836','Never Blue','30 ml.',3 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,570,'8857128012023','Voyage','30 ml.',3 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,571,'8857128011898','Vivid','30 ml.',3 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,572,'8857128011577','Angel','50 ml.',2 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,573,'8857128012134','ถุงกระดาษ Size M','Size M',80 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,574,'VXM50','Virgin X TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,575,'SIL50','Silver TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,576,'VIM50','Vivid TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,577,'8857128011966','Vintage','30 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,578,'8857128011270','Vintage','50 ml.',5 from purchase_orders where po_number='WP0260602001' and coalesce(version,'')='WP0260602001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,579,'8857128011041','Persist','50 ml.',5 from purchase_orders where po_number='WP0260604001' and coalesce(version,'')='WP0260604001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,580,'8857128012020','Make Way','50 ml.',2 from purchase_orders where po_number='WP0260604001' and coalesce(version,'')='WP0260604001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,581,'8857128012030','Dream Island','10 ml.',5 from purchase_orders where po_number='WP0260604001' and coalesce(version,'')='WP0260604001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,582,'8857128012028','Make Way','10 ml.',3 from purchase_orders where po_number='WP0260604001' and coalesce(version,'')='WP0260604001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,583,'8857128011263','Victory','10 ml.',3 from purchase_orders where po_number='WP0260604001' and coalesce(version,'')='WP0260604001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,584,'8857128012108','Sparkling Mandarin','10 ml.',2 from purchase_orders where po_number='WP0260604001' and coalesce(version,'')='WP0260604001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,585,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260606001' and coalesce(version,'')='WP0260606001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,586,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260606001' and coalesce(version,'')='WP0260606001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,587,'8857128012042','Persist','10 ml.',5 from purchase_orders where po_number='WP0260606001' and coalesce(version,'')='WP0260606001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,588,'8857128012166','Angel','10 ml.',3 from purchase_orders where po_number='WP0260606001' and coalesce(version,'')='WP0260606001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,589,'8857128011669','Blackest Black','50 ml.',2 from purchase_orders where po_number='WP0260606001' and coalesce(version,'')='WP0260606001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,590,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,591,'8857128012027','Voyage','10 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,592,'8857128012157','Passion','10 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,593,'8857128011287','Never Blue','50 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,594,'8857128011119','Secret of Peach','50 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,595,'8857128012166','Angel','10 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,596,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,597,'8857128011881','Persist','30 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,598,'8857128011621','Rosarine','50 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,599,'8857128012159','Rosarine','30 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,600,'8857128011997','Virgin X','30 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,601,'8857128011300','Dream Island','50 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,602,'8857128012062','Excalibur (EDP)','10 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,603,'8857128012053','Virgin X','10 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,604,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,605,'8857128012101','Blackest Black','10 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,606,'8857128012110','Legend of Oud','10 ml.',3 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,607,'SOM50','Soir TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,608,'THM50','1000 Thousand TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,609,'SEM50','Senorita TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,610,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,611,'8857128012167','Angel','4 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,612,'8857128012045','Voyage','4 ml.',5 from purchase_orders where po_number='WP0260610001' and coalesce(version,'')='WP0260610001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,613,'8857128011829','Fortuna','50 ml.',5 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,614,'8857128012172','Fortuna','30 ml.',5 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,615,'8857128012173','Fortuna','10 ml.',9 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,616,'8857128011799','Nouveau','50 ml.',5 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,617,'8857128012169','Nouveau','30 ml.',5 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,618,'8857128012170','Nouveau','10 ml.',9 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,619,'8857128012022','Aqua','30 ml.',3 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,620,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,621,'8857128012042','Persist','10 ml.',5 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,622,'8857128012157','Passion','10 ml.',3 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,623,'8857128012108','Sparkling Mandarin','10 ml.',3 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,624,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,625,'FOM50','Fortuna TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,626,'NOM50','Nouveau TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260612001' and coalesce(version,'')='WP0260612001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,627,'8857128011041','Persist','50 ml.',2 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,628,'8857128012007','Legend of Oud','30 ml.',1 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,629,'8857128012159','Rosarine','30 ml.',3 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,630,'8857128012030','Dream Island','10 ml.',10 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,631,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,632,'8857128012166','Angel','10 ml.',5 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,633,'8857128012110','Legend of Oud','10 ml.',2 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,634,'8857128011294','Shadow De Bacci Light','50 ml.',2 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,635,'8857128012092','Shadow De Bacci Light','30 ml.',3 from purchase_orders where po_number='WP0260617001' and coalesce(version,'')='WP0260617001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,636,'8857128011522','Velvet Oud','50 ml.',3 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,637,'8857128011171','Senorita','50 ml.',3 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,638,'8857128011287','Never Blue','50 ml.',3 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,639,'8857128011683','Legend of Oud','50 ml.',1 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,640,'8857128011867','Senorita','30 ml.',5 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,641,'8857128012008','Luscious Santal','30 ml.',1 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,642,'8857128012169','Nouveau','30 ml.',5 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,643,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,644,'8857128012173','Fortuna','10 ml.',5 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,645,'8857128012170','Nouveau','10 ml.',5 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,646,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,647,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,648,'8857128012042','Persist','10 ml.',5 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,649,'8857128012065','Blind Magnolia','10 ml.',3 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,650,'8857128012124','What','10 ml.',3 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,651,'8857128012101','Blackest Black','10 ml.',3 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,652,'8857128012122','Luscious Santal','10 ml.',3 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,653,'NBM50','Never Blue TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,654,'8857128012133','ถุงกระดาษ Size S','Size S',40 from purchase_orders where po_number='WP0260622001' and coalesce(version,'')='WP0260622001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,655,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260624001' and coalesce(version,'')='WP0260624001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,656,'8857128011966','Vintage','30 ml.',3 from purchase_orders where po_number='WP0260624001' and coalesce(version,'')='WP0260624001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,657,'8857128012165','Angel','30 ml.',5 from purchase_orders where po_number='WP0260624001' and coalesce(version,'')='WP0260624001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,658,'8857128011843','Zeus','30 ml.',3 from purchase_orders where po_number='WP0260624001' and coalesce(version,'')='WP0260624001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,659,'8857128011317','Eden','50 ml.',3 from purchase_orders where po_number='WP0260624001' and coalesce(version,'')='WP0260624001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,660,'8857128011027','Zeus','50 ml.',3 from purchase_orders where po_number='WP0260624001' and coalesce(version,'')='WP0260624001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,661,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260625001' and coalesce(version,'')='WP0260625001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,662,'8857128011645','What','50 ml.',1 from purchase_orders where po_number='WP0260625001' and coalesce(version,'')='WP0260625001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,663,'8857128012027','Voyage','10 ml.',3 from purchase_orders where po_number='WP0260625001' and coalesce(version,'')='WP0260625001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,664,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260625001' and coalesce(version,'')='WP0260625001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,665,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,666,'8857128012030','Dream Island','10 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,667,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,668,'8857128012026','Aqua','10 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,669,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,670,'8857128012053','Virgin X','10 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,671,'8857128012060','Vivid','10 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,672,'8857128011874','Dream Island','30 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,673,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,674,'8857128011119','Secret of Peach','50 ml.',10 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,675,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,676,'DIM50','Dream Island TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,677,'LBM50','La Belle TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,678,'VIM50','Vivid TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,679,'8857128012133','ถุงกระดาษ Size S','Size S',40 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,680,'8857128011737','Hercules','30 ml.',2 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,681,'8857128011379','Wealth','50 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,682,'8857128012095','Wealth','30 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,683,'8857128012096','Wealth','10 ml.',9 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,684,'8857128011249','Mellow','50 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,685,'8857128012148','Mellow','30 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,686,'8857128012149','Mellow','10 ml.',9 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,687,'8857128011300','Dream Island','50 ml.',3 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,688,'8857128012023','Voyage','30 ml.',3 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,689,'8857128012010','Sparkling Mandarin','30 ml.',1 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,690,'8857128012007','Legend of Oud','30 ml.',1 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,691,'8857128012093','Shadow De Bacci Light','10 ml.',3 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,692,'8857128012047','Velvet Oud','10 ml.',3 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,693,'8857128012157','Passion','10 ml.',3 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,694,'WEM50','Wealth TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,695,'MEM50','Mellow TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,696,'8857128012164','Silver','4 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,697,'8857128012158','Passion','4 ml.',5 from purchase_orders where po_number='WP0260629001' and coalesce(version,'')='WP0260629001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,698,'8857128012079','Vintage','10 ml.',3 from purchase_orders where po_number='WP0260702001' and coalesce(version,'')='WP0260702001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,699,'8857128012170','Nouveau','10 ml.',3 from purchase_orders where po_number='WP0260702001' and coalesce(version,'')='WP0260702001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,700,'8857128012027','Voyage','10 ml.',3 from purchase_orders where po_number='WP0260702001' and coalesce(version,'')='WP0260702001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,701,'8857128012026','Aqua','10 ml.',3 from purchase_orders where po_number='WP0260702001' and coalesce(version,'')='WP0260702001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,702,'8857128012008','Luscious Santal','30 ml.',1 from purchase_orders where po_number='WP0260702001' and coalesce(version,'')='WP0260702001-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,703,'8857128011829','Fortuna','50 ml.',3 from purchase_orders where po_number='WP0260706001' and coalesce(version,'')='WP0260706001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,704,'8857128011621','Rosarine','50 ml.',5 from purchase_orders where po_number='WP0260706001' and coalesce(version,'')='WP0260706001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,705,'8857128011607','Queen','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,706,'8857128011614','Savoury','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,707,'8857128011645','What','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,708,'8857128011669','Blackest Black','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,709,'8857128011683','Legend of Oud','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,710,'8857128011713','Sparkling Mandarin','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,711,'8857128011119','Secret of Peach','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,712,'8857128011171','Senorita','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,713,'8857128011300','Dream Island','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,714,'8857128011287','Never Blue','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,715,'8857128011621','Rosarine','50 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,716,'8857128011904','La Belle','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,717,'8857128012022','Aqua','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,718,'8857128012023','Voyage','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,719,'8857128012048','Velvet Oud','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,720,'8857128011843','Zeus','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,721,'8857128012165','Angel','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,722,'8857128012169','Nouveau','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,723,'8857128012162','Silver','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,724,'8857128012172','Fortuna','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,725,'8857128012156','Passion','30 ml.',1 from purchase_orders where po_number='WP0260707001' and coalesce(version,'')='WP0260707001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,726,'8857128011119','Secret of Peach','50 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,727,'8857128011171','Senorita','50 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,728,'8857128011300','Dream Island','50 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,729,'8857128011287','Never Blue','50 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,730,'8857128011621','Rosarine','50 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,731,'8857128011904','La Belle','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,732,'8857128012022','Aqua','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,733,'8857128012023','Voyage','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,734,'8857128012048','Velvet Oud','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,735,'8857128011843','Zeus','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,736,'8857128012165','Angel','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,737,'8857128012169','Nouveau','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,738,'8857128012162','Silver','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,739,'8857128012172','Fortuna','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,740,'8857128012156','Passion','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,741,'8857128011850','Secret of Peach','30 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,742,'8857128011867','Senorita','30 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,743,'8857128011836','Never Blue','30 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,744,'8857128011874','Dream Island','30 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,745,'8857128012159','Rosarine','30 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,746,'8857128011058','La Belle','50 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,747,'8857128012018','Aqua','50 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,748,'8857128011522','Velvet Oud','50 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,749,'8857128011027','Zeus','50 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,750,'8857128011577','Angel','50 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,751,'8857128011799','Nouveau','50 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,752,'8857128012001','Queen','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,753,'8857128012002','Savoury','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,754,'8857128012013','What','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,755,'8857128012005','Blackest Black','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,756,'8857128012007','Legend of Oud','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,757,'8857128012010','Sparkling Mandarin','30 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,758,'8857128012026','Aqua','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,759,'8857128012030','Dream Island','10 ml.',3 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,760,'8857128012034','La Belle','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,761,'8857128012037','Secret of Peach','10 ml.',3 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,762,'8857128012039','Senorita','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,763,'8857128012047','Velvet Oud','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,764,'8857128012027','Voyage','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,765,'8857128012041','Zeus','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,766,'8857128012160','Rosarine','10 ml.',3 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,767,'8857128012157','Passion','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,768,'8857128012163','Silver','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,769,'8857128012166','Angel','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,770,'8857128012173','Fortuna','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,771,'8857128012170','Nouveau','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,772,'8857128012116','Queen','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,773,'8857128012118','Savoury','10 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,774,'8857128012124','What','10 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,775,'8857128012101','Blackest Black','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,776,'8857128012110','Legend of Oud','10 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,777,'8857128012112','Tropical Leather','10 ml.',1 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,778,'8857128012103','Gambling34+35','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,779,'8857128012108','Sparkling Mandarin','10 ml.',2 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,780,'8857128012015','Dream Island','4 ml.',40 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,781,'8857128012038','Secret of Peach','4 ml.',30 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,782,'8857128012036','Never Blue','4 ml.',30 from purchase_orders where po_number='WP0260707002' and coalesce(version,'')='WP0260707002-2';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,783,'8857128012026','Aqua','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,784,'8857128012032','Beyond','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,785,'8857128012077','Buoyant','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,786,'8857128012030','Dream Island','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,787,'8857128012128','Dynasty','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,788,'8857128012058','Eden','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,789,'8857128012062','Excalibur (EDP)','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,790,'8857128011744','Hercules','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,791,'8857128012034','La Belle','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,792,'8857128012028','Make Way','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,793,'8857128012035','Never Blue','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,794,'8857128012042','Persist','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,795,'8857128012037','Secret of Peach','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,796,'8857128012039','Senorita','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,797,'8857128012093','Shadow De Bacci Light','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,798,'8857128012055','Sicilia','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,799,'8857128012070','Teenage Dream','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,800,'8857128012047','Velvet Oud','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,801,'8857128011263','Victory','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,802,'8857128012053','Virgin X','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,803,'8857128012060','Vivid','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,804,'8857128012027','Voyage','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,805,'8857128012041','Zeus','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,806,'8857128012101','Blackest Black','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,807,'8857128012110','Legend of Oud','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,808,'8857128012122','Luscious Santal','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,809,'8857128012108','Sparkling Mandarin','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,810,'8857128012112','Tropical Leather','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,811,'8857128012103','Gambling34+35','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,812,'8857128012116','Queen','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,813,'8857128012118','Savoury','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,814,'8857128012142','Gentle Elixir','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,815,'8857128012146','Soir','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,816,'8857128012154','Cherry Shade','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,817,'8857128012157','Passion','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,818,'8857128012160','Rosarine','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,819,'8857128012163','Silver','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,820,'8857128012149','Mellow','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,821,'8857128012124','What','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,822,'8857128012114','Patchouli Absolute','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,823,'8857128012151','Amber Spangle','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,824,'8857128012166','Angel','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,825,'8857128012079','Vintage','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,826,'8857128012173','Fortuna','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,827,'8857128012170','Nouveau','10 ml.',1 from purchase_orders where po_number='WP0260707003' and coalesce(version,'')='WP0260707003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,828,'8857128012039','Senorita','10 ml.',10 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,829,'8857128012034','La Belle','10 ml.',5 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,830,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,831,'8857128012173','Fortuna','10 ml.',5 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,832,'8857128012170','Nouveau','10 ml.',5 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,833,'8857128012060','Vivid','10 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,834,'8857128012154','Cherry Shade','10 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,835,'8857128012022','Aqua','30 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,836,'8857128011836','Never Blue','30 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,837,'8857128012007','Legend of Oud','30 ml.',1 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,838,'8857128012165','Angel','30 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,839,'8857128011171','Senorita','50 ml.',5 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,840,'8857128011621','Rosarine','50 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,841,'8857128011577','Angel','50 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,842,'8857128011799','Nouveau','50 ml.',5 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,843,'8857128011287','Never Blue','50 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,844,'8857128011300','Dream Island','50 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,845,'8857128012018','Aqua','50 ml.',3 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,846,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,847,'8857128012133','ถุงกระดาษ Size S','Size S',40 from purchase_orders where po_number='WP0260709001' and coalesce(version,'')='WP0260709001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,848,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260709002' and coalesce(version,'')='WP0260709002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,849,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260709002' and coalesce(version,'')='WP0260709002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,850,'8857128012132','Cloth BAG CYOC','Size M',10 from purchase_orders where po_number='WP0260709002' and coalesce(version,'')='WP0260709002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,851,'8857128012134','ถุงกระดาษ Size M','Size M',40 from purchase_orders where po_number='WP0260709002' and coalesce(version,'')='WP0260709002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,852,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260709002' and coalesce(version,'')='WP0260709002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,853,'8857128011119','Secret of Peach','50 ml.',5 from purchase_orders where po_number='WP0260709002' and coalesce(version,'')='WP0260709002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,854,'8857128012022','Aqua','30 ml.',2 from purchase_orders where po_number='WP0260709002' and coalesce(version,'')='WP0260709002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,855,'8857128011836','Never Blue','30 ml.',3 from purchase_orders where po_number='WP0260709002' and coalesce(version,'')='WP0260709002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,856,'8857128011560','Cherry Shade','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,857,'8857128012019','Voyage','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,858,'8857128011171','Senorita','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,859,'8857128011058','La Belle','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,860,'8857128012018','Aqua','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,861,'8857128011287','Never Blue','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,862,'8857128012020','Make Way','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,863,'8857128011027','Zeus','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,864,'8857128011119','Secret of Peach','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,865,'8857128011300','Dream Island','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,866,'8857128011621','Rosarine','50 ml.',1 from purchase_orders where po_number='WP0260709003' and coalesce(version,'')='WP0260709003-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,867,'8857128011621','Rosarine','50 ml.',3 from purchase_orders where po_number='WP0260711001' and coalesce(version,'')='WP0260711001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,868,'8857128012169','Nouveau','30 ml.',1 from purchase_orders where po_number='WP0260711001' and coalesce(version,'')='WP0260711001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,869,'8857128012030','Dream Island','10 ml.',1 from purchase_orders where po_number='WP0260711001' and coalesce(version,'')='WP0260711001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,870,'8857128012041','Zeus','10 ml.',1 from purchase_orders where po_number='WP0260711001' and coalesce(version,'')='WP0260711001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,871,'8857128012160','Rosarine','10 ml.',1 from purchase_orders where po_number='WP0260711001' and coalesce(version,'')='WP0260711001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,872,'8857128012166','Angel','10 ml.',1 from purchase_orders where po_number='WP0260711001' and coalesce(version,'')='WP0260711001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,873,'8857128012134','ถุงกระดาษ Size M','Size M',15 from purchase_orders where po_number='WP0260711001' and coalesce(version,'')='WP0260711001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,874,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260713001' and coalesce(version,'')='WP0260713001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,875,'8857128012154','Cherry Shade','10 ml.',5 from purchase_orders where po_number='WP0260713001' and coalesce(version,'')='WP0260713001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,876,'8857128012166','Angel','10 ml.',5 from purchase_orders where po_number='WP0260713001' and coalesce(version,'')='WP0260713001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,877,'8857128012153','Cherry Shade','30 ml.',3 from purchase_orders where po_number='WP0260713001' and coalesce(version,'')='WP0260713001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,878,'8857128011713','Sparkling Mandarin','50 ml.',1 from purchase_orders where po_number='WP0260713001' and coalesce(version,'')='WP0260713001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,879,'LOM50','Legend of Oud TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260713001' and coalesce(version,'')='WP0260713001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,880,'8857128011300','Dream Island','50 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,881,'8857128011874','Dream Island','30 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,882,'8857128012030','Dream Island','10 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,883,'8857128011027','Zeus','50 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,884,'8857128011843','Zeus','30 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,885,'8857128012041','Zeus','10 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,886,'8857128011119','Secret of Peach','50 ml.',6 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,887,'8857128011850','Secret of Peach','30 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,888,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,889,'8857128011171','Senorita','50 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,890,'8857128011867','Senorita','30 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,891,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,892,'8857128011621','Rosarine','50 ml.',10 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,893,'8857128012159','Rosarine','30 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,894,'8857128012160','Rosarine','10 ml.',10 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,895,'8857128011058','La Belle','50 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,896,'8857128011904','La Belle','30 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,897,'8857128012034','La Belle','10 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,898,'8857128012018','Aqua','50 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,899,'8857128012022','Aqua','30 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,900,'8857128012026','Aqua','10 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,901,'8857128012019','Voyage','50 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,902,'8857128012023','Voyage','30 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,903,'8857128012027','Voyage','10 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,904,'8857128011522','Velvet Oud','50 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,905,'8857128012048','Velvet Oud','30 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,906,'8857128012047','Velvet Oud','10 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,907,'8857128011577','Angel','50 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,908,'8857128012165','Angel','30 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,909,'8857128012166','Angel','10 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,910,'8857128011799','Nouveau','50 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,911,'8857128012169','Nouveau','30 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,912,'8857128012170','Nouveau','10 ml.',5 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,913,'8857128011638','Silver','50 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,914,'8857128012162','Silver','30 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,915,'8857128012163','Silver','10 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,916,'8857128011829','Fortuna','50 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,917,'8857128012172','Fortuna','30 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,918,'8857128012173','Fortuna','10 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,919,'8857128011584','Passion','50 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,920,'8857128012156','Passion','30 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,921,'8857128012157','Passion','10 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,922,'8857128011669','Blackest Black','50 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,923,'8857128012005','Blackest Black','30 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,924,'8857128012101','Blackest Black','10 ml.',4 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,925,'8857128011683','Legend of Oud','50 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,926,'8857128012007','Legend of Oud','30 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,927,'8857128012110','Legend of Oud','10 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,928,'8857128011713','Sparkling Mandarin','50 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,929,'8857128012010','Sparkling Mandarin','30 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,930,'8857128012108','Sparkling Mandarin','10 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,931,'8857128011645','What','50 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,932,'8857128012124','What','10 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,933,'8857128011591','Gambling34+35','50 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,934,'8857128012103','Gambling34+35','10 ml.',2 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,935,'8857128011607','Queen','50 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,936,'8857128012116','Queen','10 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,937,'8857128011614','Savoury','50 ml.',1 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,938,'8857128012118','Savoury','10 ml.',3 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,939,'8857128012134','ถุงกระดาษ Size M','Size M',20 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,940,'8857128012133','ถุงกระดาษ Size S','Size S',40 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,941,'8857128012132','Cloth BAG CYOC','Size M',20 from purchase_orders where po_number='WP0260715001' and coalesce(version,'')='WP0260715001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,942,'8857128011836','Never Blue','30 ml.',2 from purchase_orders where po_number='WP0260716002' and coalesce(version,'')='WP0260716002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,943,'8857128012005','Blackest Black','30 ml.',1 from purchase_orders where po_number='WP0260716002' and coalesce(version,'')='WP0260716002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,944,'8857128012035','Never Blue','10 ml.',2 from purchase_orders where po_number='WP0260716002' and coalesce(version,'')='WP0260716002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,945,'8857128011287','Never Blue','50 ml.',3 from purchase_orders where po_number='WP0260716002' and coalesce(version,'')='WP0260716002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,946,'8857128011669','Blackest Black','50 ml.',1 from purchase_orders where po_number='WP0260716002' and coalesce(version,'')='WP0260716002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,947,'8857128011683','Legend of Oud','50 ml.',1 from purchase_orders where po_number='WP0260716002' and coalesce(version,'')='WP0260716002-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,948,'8857128012030','Dream Island','10 ml.',5 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,949,'8857128012026','Aqua','10 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,950,'8857128012028','Make Way','10 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,951,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,952,'8857128012027','Voyage','10 ml.',10 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,953,'8857128011935','Excalibur (EDP)','30 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,954,'8857128011843','Zeus','30 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,955,'8857128011713','Sparkling Mandarin','50 ml.',2 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,956,'8857128011294','Shadow De Bacci Light','50 ml.',1 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,957,'8857128012112','Tropical Leather','10 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,958,'8857128012133','ถุงกระดาษ Size S','Size S',40 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,959,'8857128012128','Dynasty','10 ml.',2 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,960,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,961,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,962,'8857128011904','La Belle','30 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,963,'8857128012009','Patchouli Absolute','30 ml.',1 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,964,'8857128011119','Secret of Peach','50 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,965,'8857128011287','Never Blue','50 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,966,'AGM50','Angel TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,967,'SPM50','Secret of Peach TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,968,'AQM50','Aqua TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,969,'ROS50','Rosarine TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,970,'8857128012022','Aqua','30 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,971,'8857128011065','Vivid','50 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,972,'8857128012156','Passion','30 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,973,'8857128012019','Voyage','50 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,974,'8857128011584','Passion','50 ml.',3 from purchase_orders where po_number='WP0260717001' and coalesce(version,'')='WP0260717001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,975,'8857128011621','Rosarine','50 ml.',5 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,976,'8857128012019','Voyage','50 ml.',3 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,977,'8857128011287','Never Blue','50 ml.',3 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,978,'8857128011867','Senorita','30 ml.',3 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,979,'8857128011904','La Belle','30 ml.',3 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,980,'8857128012022','Aqua','30 ml.',2 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,981,'8857128012169','Nouveau','30 ml.',3 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,982,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,983,'8857128012157','Passion','10 ml.',5 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,984,'8857128012170','Nouveau','10 ml.',5 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,985,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,986,'8857128012034','La Belle','10 ml.',5 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,987,'8857128012027','Voyage','10 ml.',3 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,988,'8857128012007','Legend of Oud','30 ml.',1 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,989,'8857128012110','Legend of Oud','10 ml.',3 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,990,'8857128012038','Secret of Peach','4 ml.',10 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,991,'8857128012036','Never Blue','4 ml.',10 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,992,'8857128012133','ถุงกระดาษ Size S','Size S',20 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,993,'8857128012134','ถุงกระดาษ Size M','Size M',20 from purchase_orders where po_number='WP0260719001' and coalesce(version,'')='WP0260719001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,994,'8857128012154','Cherry Shade','10 ml.',10 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,995,'8857128012037','Secret of Peach','10 ml.',5 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,996,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,997,'8857128012034','La Belle','10 ml.',5 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,998,'8857128012170','Nouveau','10 ml.',5 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,999,'8857128012053','Virgin X','10 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1000,'8857128012157','Passion','10 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1001,'8857128012042','Persist','10 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1002,'8857128012110','Legend of Oud','10 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1003,'8857128012007','Legend of Oud','30 ml.',1 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1004,'8857128012013','What','30 ml.',1 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1005,'8857128012153','Cherry Shade','30 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1006,'8857128011874','Dream Island','30 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1007,'8857128012048','Velvet Oud','30 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1008,'8857128011027','Zeus','50 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1009,'8857128011560','Cherry Shade','50 ml.',3 from purchase_orders where po_number='WP0260721001' and coalesce(version,'')='WP0260721001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1010,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1011,'8857128011263','Victory','10 ml.',5 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1012,'8857128012026','Aqua','10 ml.',5 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1013,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1014,'8857128012154','Cherry Shade','10 ml.',5 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1015,'8857128012157','Passion','10 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1016,'8857128012047','Velvet Oud','10 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1017,'8857128012101','Blackest Black','10 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1018,'8857128012108','Sparkling Mandarin','10 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1019,'8857128012124','What','10 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1020,'8857128012159','Rosarine','30 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1021,'8857128012169','Nouveau','30 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1022,'8857128012022','Aqua','30 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1023,'8857128012145','Soir','30 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1024,'8857128012172','Fortuna','30 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1025,'8857128012140','Gentle Elixir','50 ml.',3 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1026,'8857128012133','ถุงกระดาษ Size S','Size S',80 from purchase_orders where po_number='WP0260724001' and coalesce(version,'')='WP0260724001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1027,'8857128012037','Secret of Peach','10 ml.',10 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1028,'8857128012039','Senorita','10 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1029,'8857128012160','Rosarine','10 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1030,'8857128012026','Aqua','10 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1031,'8857128012030','Dream Island','10 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1032,'8857128012053','Virgin X','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1033,'8857128012027','Voyage','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1034,'8857128012079','Vintage','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1035,'8857128012163','Silver','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1036,'8857128012166','Angel','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1037,'8857128012077','Buoyant','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1038,'8857128012062','Excalibur (EDP)','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1039,'8857128012070','Teenage Dream','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1040,'8857128012093','Shadow De Bacci Light','10 ml.',2 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1041,'8857128011744','Hercules','10 ml.',2 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1042,'8857128012101','Blackest Black','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1043,'8857128012110','Legend of Oud','10 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1044,'8857128012023','Voyage','30 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1045,'8857128012159','Rosarine','30 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1046,'8857128012022','Aqua','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1047,'8857128011850','Secret of Peach','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1048,'8857128011966','Vintage','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1049,'8857128011737','Hercules','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1050,'8857128012048','Velvet Oud','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1051,'8857128012141','Gentle Elixir','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1052,'8857128012005','Blackest Black','30 ml.',1 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1053,'8857128011669','Blackest Black','50 ml.',1 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1054,'8857128012019','Voyage','50 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1055,'8857128011119','Secret of Peach','50 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1056,'8857128012020','Make Way','50 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1057,'8857128011027','Zeus','50 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1058,'8857128011522','Velvet Oud','50 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1059,'8857128012140','Gentle Elixir','50 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1060,'CRS50','Cherry Shade TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1061,'8857128012036','Never Blue','4 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1062,'8857128012038','Secret of Peach','4 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1063,'8857128011928','Atlantis','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1064,'8857128012089','Found Peony','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1065,'8857128011942','Rose Oud','30 ml.',5 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1066,'8857128011980','Vandal','30 ml.',3 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1067,'ATM-30','Atlantis TRY ME!','30 ml.',1 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1068,'VAM-30','Vandal TRY ME!','30 ml.',1 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1069,'FPM-30','Found Peony TRY ME!','30 ml.',1 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1070,'ROM-30','Rose Oud TRY ME!','30 ml.',1 from purchase_orders where po_number='WP0260729001' and coalesce(version,'')='WP0260729001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1071,'8857128012026','Aqua','10 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1072,'8857128012034','La Belle','10 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1073,'8857128012053','Virgin X','10 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1074,'8857128012035','Never Blue','10 ml.',5 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1075,'8857128012108','Sparkling Mandarin','10 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1076,'8857128012114','Patchouli Absolute','10 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1077,'8857128012142','Gentle Elixir','10 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1078,'8857128011850','Secret of Peach','30 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1079,'8857128012064','Blind Magnolia','30 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1080,'8857128011898','Vivid','30 ml.',5 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1081,'8857128011867','Senorita','30 ml.',5 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1082,'8857128012024','Make Way','30 ml.',3 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1083,'8857128012011','Tropical Leather','30 ml.',2 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1084,'8857128011225','Blind Magnolia','50 ml.',2 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1085,'8857128011713','Sparkling Mandarin','50 ml.',1 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1086,'8857128011201','Perfect Pear','50 ml.',5 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1087,'8857128011973','Perfect Pear','30 ml.',5 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1088,'8857128012084','Perfect Pear','10 ml.',10 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1089,'MWM50','Make Way TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1090,'VGM50','Voyage TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1091,'ZEM50','Zeus TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1092,'EXM50','Excalibur (EDP) TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1093,'PPM50','Perfect Pear TRY ME!','50 ml.',1 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';
insert into po_items (po_id,line_no,barcode,scent,size,qty) select id,1094,'8857128012004','Amber Spangle','30 ml.',1 from purchase_orders where po_number='WP0260731001' and coalesce(version,'')='WP0260731001-1';

-- shipment_items (1158)
insert into shipment_items (line_no,ship_date,po_number,sku,name,serial,grade,size,branch_label,receive_status) values
(1,'2025-11-20','WPO251120001','Lab50 TA6688','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(2,'2025-11-20','WPO251120001','Lab50 TA6774','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(3,'2025-11-20','WPO251120001','Lab50 TA6737','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(4,'2025-11-20','WPO251120001','Lab50 TA6750','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(5,'2025-11-20','WPO251120001','Lab50 TA6733','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(6,'2025-11-20','WPO251120001','Lab50 TA6696','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(7,'2025-11-20','WPO251120001','Lab50 TA6704','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(8,'2025-11-20','WPO251120001','Lab50 TA6694','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(9,'2025-11-20','WPO251120001','Lab50 TA6769','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(10,'2025-11-20','WPO251120001','Lab50 TA6735','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(11,'2025-11-20','WPO251120001','Lab50 TA6709','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(12,'2025-11-20','WPO251120001','Lab50 TA6752','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(13,'2025-11-20','WPO251120001','Lab50 TA6740','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(14,'2025-11-20','WPO251120001','Lab50 TA6680','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(15,'2025-11-20','WPO251120001','Lab50 TA6683','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(16,'2025-11-20','WPO251120001','Lab50 TA6739','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(17,'2025-11-20','WPO251120001','Lab50 TA6755','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(18,'2025-11-20','WPO251120001','Lab50 TA6741','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(19,'2025-11-20','WPO251120001','Lab50 TA6745','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(20,'2025-11-20','WPO251120001','Lab50 TA6744','Never Blue','8857128011287','EDP','50 ml.','01_CTW - Central Word','Receive'),
(21,'2025-11-20','WPO251120001','Lab50 TA6970','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(22,'2025-11-20','WPO251120001','Lab50 TA6978','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(23,'2025-11-20','WPO251120001','Lab50 TA6986','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(24,'2025-11-20','WPO251120001','Lab50 TA6974','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(25,'2025-11-20','WPO251120001','Lab50 TA6973','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(26,'2025-11-20','WPO251120001','Lab50 TA6980','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(27,'2025-11-20','WPO251120001','Lab50 TA6975','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(28,'2025-11-20','WPO251120001','Lab50 TA6987','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(29,'2025-11-20','WPO251120001','Lab50 TA6977','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(30,'2025-11-20','WPO251120001','Lab50 TA6968','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(31,'2025-11-20','WPO251120001','Lab50 TA6993','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(32,'2025-11-20','WPO251120001','Lab50 TA6971','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(33,'2025-11-20','WPO251120001','Lab50 TA6982','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(34,'2025-11-20','WPO251120001','Lab50 TA6983','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(35,'2025-11-20','WPO251120001','Lab50 TA6979','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(36,'2025-11-20','WPO251120001','Lab50 TA6976','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(37,'2025-11-20','WPO251120001','Lab50 TA6981','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(38,'2025-11-20','WPO251120001','Lab50 TA6985','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(39,'2025-11-20','WPO251120001','Lab50 TA6991','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(40,'2025-11-20','WPO251120001','Lab50 TA6967','Dream Island','8857128011300','EDP','50 ml.','01_CTW - Central Word','Receive'),
(41,'2025-11-20','WPO251120001','Lab50 TA6565','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(42,'2025-11-20','WPO251120001','Lab50 TA6564','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(43,'2025-11-20','WPO251120001','Lab50 TA6579','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(44,'2025-11-20','WPO251120001','Lab50 TA6577','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(45,'2025-11-20','WPO251120001','Lab50 TA6571','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(46,'2025-11-20','WPO251120001','Lab50 TA6561','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(47,'2025-11-20','WPO251120001','Lab50 TA6573','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(48,'2025-11-20','WPO251120001','Lab50 TA6582','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(49,'2025-11-20','WPO251120001','Lab50 TA6560','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(50,'2025-11-20','WPO251120001','Lab50 TA6578','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(51,'2025-11-20','WPO251120001','Lab50 TA6570','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(52,'2025-11-20','WPO251120001','Lab50 TA6559','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(53,'2025-11-20','WPO251120001','Lab50 TA6572','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(54,'2025-11-20','WPO251120001','Lab50 TA6562','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(55,'2025-11-20','WPO251120001','Lab50 TA6569','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(56,'2025-11-20','WPO251120001','Lab50 TA6574','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(57,'2025-11-20','WPO251120001','Lab50 TA6568','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(58,'2025-11-20','WPO251120001','Lab50 TA6563','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(59,'2025-11-20','WPO251120001','Lab50 TA6580','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(60,'2025-11-20','WPO251120001','Lab50 TA6581','Senorita','8857128011171','EDP','50 ml.','01_CTW - Central Word','Receive'),
(61,'2025-11-20','WPO251120001','Lab50 TA7397','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(62,'2025-11-20','WPO251120001','Lab50 TA7400','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(63,'2025-11-20','WPO251120001','Lab50 TA7403','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(64,'2025-11-20','WPO251120001','Lab50 TA7399','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(65,'2025-11-20','WPO251120001','Lab50 TA7389','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(66,'2025-11-20','WPO251120001','Lab50 TA7382','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(67,'2025-11-20','WPO251120001','Lab50 TA7374','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(68,'2025-11-20','WPO251120001','Lab50 TA7390','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(69,'2025-11-20','WPO251120001','Lab50 TA7405','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(70,'2025-11-20','WPO251120001','Lab50 TA7402','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(71,'2025-11-20','WPO251120001','Lab50 TA7372','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(72,'2025-11-20','WPO251120001','Lab50 TA7379','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(73,'2025-11-20','WPO251120001','Lab50 TA7406','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(74,'2025-11-20','WPO251120001','Lab50 TA7381','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(75,'2025-11-20','WPO251120001','Lab50 TA7380','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(76,'2025-11-20','WPO251120001','Lab50 TA7373','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(77,'2025-11-20','WPO251120001','Lab50 TA7401','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(78,'2025-11-20','WPO251120001','Lab50 TA7404','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(79,'2025-11-20','WPO251120001','Lab50 TA7398','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(80,'2025-11-20','WPO251120001','Lab50 TA7371','La Belle','8857128011058','EDP','50 ml.','01_CTW - Central Word','Receive'),
(81,'2025-11-20','WPO251120001','Lab50 TA6358','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(82,'2025-11-20','WPO251120001','Lab50 TA6360','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(83,'2025-11-20','WPO251120001','Lab50 TA6354','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(84,'2025-11-20','WPO251120001','Lab50 TA6334','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(85,'2025-11-20','WPO251120001','Lab50 TA6349','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(86,'2025-11-20','WPO251120001','Lab50 TA6359','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(87,'2025-11-20','WPO251120001','Lab50 TA6345','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(88,'2025-11-20','WPO251120001','Lab50 TA6363','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(89,'2025-11-20','WPO251120001','Lab50 TA6350','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(90,'2025-11-20','WPO251120001','Lab50 TA6355','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(91,'2025-11-20','WPO251120001','Lab50 TA6344','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(92,'2025-11-20','WPO251120001','Lab50 TA6348','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(93,'2025-11-20','WPO251120001','Lab50 TA6353','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(94,'2025-11-20','WPO251120001','Lab50 TA6347','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(95,'2025-11-20','WPO251120001','Lab50 TA6356','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(96,'2025-11-20','WPO251120001','Lab50 TA6352','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(97,'2025-11-20','WPO251120001','Lab50 TA6361','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(98,'2025-11-20','WPO251120001','Lab50 TA6362','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(99,'2025-11-20','WPO251120001','Lab50 TA6357','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(100,'2025-11-20','WPO251120001','Lab50 TA6346','Zeus','8857128011027','EDP','50 ml.','01_CTW - Central Word','Receive'),
(101,'2025-11-20','WPO251120001','Lab50 TA7066','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(102,'2025-11-20','WPO251120001','Lab50 TA7173','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(103,'2025-11-20','WPO251120001','Lab50 TA7172','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(104,'2025-11-20','WPO251120001','Lab50 TA7171','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(105,'2025-11-20','WPO251120001','Lab50 TA7178','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(106,'2025-11-20','WPO251120001','Lab50 TA7163','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(107,'2025-11-20','WPO251120001','Lab50 TA7083','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(108,'2025-11-20','WPO251120001','Lab50 TA7159','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(109,'2025-11-20','WPO251120001','Lab50 TA7170','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(110,'2025-11-20','WPO251120001','Lab50 TA7177','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(111,'2025-11-20','WPO251120001','Lab50 TA7160','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(112,'2025-11-20','WPO251120001','Lab50 TA7174','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(113,'2025-11-20','WPO251120001','Lab50 TA7162','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(114,'2025-11-20','WPO251120001','Lab50 TA7175','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(115,'2025-11-20','WPO251120001','Lab50 TA7169','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(116,'2025-11-20','WPO251120001','Lab50 TA7179','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(117,'2025-11-20','WPO251120001','Lab50 TA7161','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(118,'2025-11-20','WPO251120001','Lab50 TA7168','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(119,'2025-11-20','WPO251120001','Lab50 TA7091','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(120,'2025-11-20','WPO251120001','Lab50 TA7073','Secret of Peach','8857128011119','EDP','50 ml.','01_CTW - Central Word','Receive'),
(121,'2025-11-20','WPO251120001','Lab50 TA6288','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(122,'2025-11-20','WPO251120001','Lab50 TA6292','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(123,'2025-11-20','WPO251120001','Lab50 TA6292','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(124,'2025-11-20','WPO251120001','Lab50 TA6275','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(125,'2025-11-20','WPO251120001','Lab50 TA6281','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(126,'2025-11-20','WPO251120001','Lab50 TA6280','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(127,'2025-11-20','WPO251120001','Lab50 TA6290','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(128,'2025-11-20','WPO251120001','Lab50 TA6272','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(129,'2025-11-20','WPO251120001','Lab50 TA6289','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(130,'2025-11-20','WPO251120001','Lab50 TA6277','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(131,'2025-11-20','WPO251120001','Lab50 TA6276','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(132,'2025-11-20','WPO251120001','Lab50 TA6279','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(133,'2025-11-20','WPO251120001','Lab50 TA6284','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(134,'2025-11-20','WPO251120001','Lab50 TA6286','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(135,'2025-11-20','WPO251120001','Lab50 TA6287','Aqua','8857128012018','EDP','50 ml.','01_CTW - Central Word','Receive'),
(136,'2025-11-20','WPO251120001','Lab50 TA7653','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(137,'2025-11-20','WPO251120001','Lab50 TA7658','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(138,'2025-11-20','WPO251120001','Lab50 TA7659','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(139,'2025-11-20','WPO251120001','Lab50 TA7661','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(140,'2025-11-20','WPO251120001','Lab50 TA7655','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(141,'2025-11-20','WPO251120001','Lab50 TA7650','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(142,'2025-11-20','WPO251120001','Lab50 TA7654','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(143,'2025-11-20','WPO251120001','Lab50 TA7652','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(144,'2025-11-20','WPO251120001','Lab50 TA7651','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(145,'2025-11-20','WPO251120001','Lab50 TA7660','Eden','8857128011317','EDP','50 ml.','01_CTW - Central Word','Receive'),
(146,'2025-11-20','WPO251120001','Lab50 TA7558','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(147,'2025-11-20','WPO251120001','Lab50 TA7556','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(148,'2025-11-20','WPO251120001','Lab50 TA7564','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(149,'2025-11-20','WPO251120001','Lab50 TA7555','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(150,'2025-11-20','WPO251120001','Lab50 TA7560','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(151,'2025-11-20','WPO251120001','Lab50 TA7561','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(152,'2025-11-20','WPO251120001','Lab50 TA7566','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(153,'2025-11-20','WPO251120001','Lab50 TA7559','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(154,'2025-11-20','WPO251120001','Lab50 TA7563','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(155,'2025-11-20','WPO251120001','Lab50 TA7565','Beyond','8857128011072','EDP','50 ml.','01_CTW - Central Word','Receive'),
(156,'2025-11-20','WPO251120001','Lab50 TA7753','Buoyant','8857128012021','EDP','50 ml.','01_CTW - Central Word','Receive'),
(157,'2025-11-20','WPO251120001','Lab50 TA7757','Buoyant','8857128012021','EDP','50 ml.','01_CTW - Central Word','Receive'),
(158,'2025-11-20','WPO251120001','Lab50 TA7759','Buoyant','8857128012021','EDP','50 ml.','01_CTW - Central Word','Receive'),
(159,'2025-11-20','WPO251120001','Lab50 TA7756','Buoyant','8857128012021','EDP','50 ml.','01_CTW - Central Word','Receive'),
(160,'2025-11-20','WPO251120001','Lab50 TA7754','Buoyant','8857128012021','EDP','50 ml.','01_CTW - Central Word','Receive'),
(161,'2025-11-20','WPO251120001','Lab50 TA7466','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(162,'2025-11-20','WPO251120001','Lab50 TA7457','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(163,'2025-11-20','WPO251120001','Lab50 TA7456','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(164,'2025-11-20','WPO251120001','Lab50 TA7462','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(165,'2025-11-20','WPO251120001','Lab50 TA7461','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(166,'2025-11-20','WPO251120001','Lab50 TA7459','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(167,'2025-11-20','WPO251120001','Lab50 TA7458','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(168,'2025-11-20','WPO251120001','Lab50 TA7460','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(169,'2025-11-20','WPO251120001','Lab50 TA7463','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(170,'2025-11-20','WPO251120001','Lab50 TA7464','VirginX','8857128011256','EDP','50 ml.','01_CTW - Central Word','Receive'),
(171,'2025-11-20','WPO251120001','Lab50 TA7696','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(172,'2025-11-20','WPO251120001','Lab50 TA7694','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(173,'2025-11-20','WPO251120001','Lab50 TA7691','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(174,'2025-11-20','WPO251120001','Lab50 TA7690','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(175,'2025-11-20','WPO251120001','Lab50 TA7692','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(176,'2025-11-20','WPO251120001','Lab50 TA7688','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(177,'2025-11-20','WPO251120001','Lab50 TA7689','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(178,'2025-11-20','WPO251120001','Lab50 TA7695','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(179,'2025-11-20','WPO251120001','Lab50 TA7687','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(180,'2025-11-20','WPO251120001','Lab50 TA7693','Sicilia','8857128011140','EDP','50 ml.','01_CTW - Central Word','Receive'),
(181,'2025-11-20','WPO251120001','Lab50 TA7529','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(182,'2025-11-20','WPO251120001','Lab50 TA7532','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(183,'2025-11-20','WPO251120001','Lab50 TA7536','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(184,'2025-11-20','WPO251120001','Lab50 TA7531','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(185,'2025-11-20','WPO251120001','Lab50 TA7533','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(186,'2025-11-20','WPO251120001','Lab50 TA7535','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(187,'2025-11-20','WPO251120001','Lab50 TA7534','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(188,'2025-11-20','WPO251120001','Lab50 TA7528','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(189,'2025-11-20','WPO251120001','Lab50 TA7527','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(190,'2025-11-20','WPO251120001','Lab50 TA7537','Voyage','8857128012019','EDP','50 ml.','01_CTW - Central Word','Receive'),
(191,'2025-11-20','WPO251120001','Lab50 TA7501','Dynasty','8857128011010','EDP','50 ml.','01_CTW - Central Word','Receive'),
(192,'2025-11-20','WPO251120001','Lab50 TA7506','Dynasty','8857128011010','EDP','50 ml.','01_CTW - Central Word','Receive'),
(193,'2025-11-20','WPO251120001','Lab50 TA7504','Dynasty','8857128011010','EDP','50 ml.','01_CTW - Central Word','Receive'),
(194,'2025-11-20','WPO251120001','Lab50 TA6037','Dynasty','8857128011010','EDP','50 ml.','01_CTW - Central Word','Receive'),
(195,'2025-11-20','WPO251120001','Lab50 TA7502','Dynasty','8857128011010','EDP','50 ml.','01_CTW - Central Word','Receive'),
(196,'2025-11-20','WPO251120001','Lab50 TA7741','Excalibur (EDP)','8857128011133','EDP','50 ml.','01_CTW - Central Word','Receive'),
(197,'2025-11-20','WPO251120001','Lab50 TA7740','Excalibur (EDP)','8857128011133','EDP','50 ml.','01_CTW - Central Word','Receive'),
(198,'2025-11-20','WPO251120001','Lab50 TA7742','Excalibur (EDP)','8857128011133','EDP','50 ml.','01_CTW - Central Word','Receive'),
(199,'2025-11-20','WPO251120001','Lab50 TA7746','Excalibur (EDP)','8857128011133','EDP','50 ml.','01_CTW - Central Word','Receive'),
(200,'2025-11-20','WPO251120001','Lab50 TA5619','Excalibur (EDP)','8857128011133','EDP','50 ml.','01_CTW - Central Word','Receive'),
(201,'2025-11-20','WPO251120001','Lab50 TA7511','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(202,'2025-11-20','WPO251120001','Lab50 TA7510','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(203,'2025-11-20','WPO251120001','Lab50 TA7509','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(204,'2025-11-20','WPO251120001','Lab50 TA7521','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(205,'2025-11-20','WPO251120001','Lab50 TA7519','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(206,'2025-11-20','WPO251120001','Lab50 TA7514','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(207,'2025-11-20','WPO251120001','Lab50 TA7512','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(208,'2025-11-20','WPO251120001','Lab50 TA7522','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(209,'2025-11-20','WPO251120001','Lab50 TA7508','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(210,'2025-11-20','WPO251120001','Lab50 TA7520','Velvet Oud','8857128011522','EDP','50 ml.','01_CTW - Central Word','Receive'),
(211,'2025-11-20','WPO251120001','Lab50 TA7259','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(212,'2025-11-20','WPO251120001','Lab50 TA6237','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(213,'2025-11-20','WPO251120001','Lab50 TA6232','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(214,'2025-11-20','WPO251120001','Lab50 TA7258','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(215,'2025-11-20','WPO251120001','Lab50 TA7260','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(216,'2025-11-20','WPO251120001','Lab50 TA7261','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(217,'2025-11-20','WPO251120001','Lab50 TA7256','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(218,'2025-11-20','WPO251120001','Lab50 TA7257','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(219,'2025-11-20','WPO251120001','Lab50 TA7255','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(220,'2025-11-20','WPO251120001','Lab50 TA6234','Vivid','8857128011065','EDP','50 ml.','01_CTW - Central Word','Receive'),
(221,'2025-11-20','WPO251120001','Lab50 TA7599','DionysusX','8857128011331','EDP','50 ml.','01_CTW - Central Word','Receive'),
(222,'2025-11-20','WPO251120001','Lab50 TA7605','DionysusX','8857128011331','EDP','50 ml.','01_CTW - Central Word','Receive'),
(223,'2025-11-20','WPO251120001','Lab50 TA7601','DionysusX','8857128011331','EDP','50 ml.','01_CTW - Central Word','Receive'),
(224,'2025-11-20','WPO251120001','Lab50 TA7604','DionysusX','8857128011331','EDP','50 ml.','01_CTW - Central Word','Receive'),
(225,'2025-11-20','WPO251120001','Lab50 TA7606','DionysusX','8857128011331','EDP','50 ml.','01_CTW - Central Word','Receive'),
(226,'2025-11-20','WPO251120001','Lab50 TA7766','Teenage Dream','8857128011096','EDP','50 ml.','01_CTW - Central Word','Receive'),
(227,'2025-11-20','WPO251120001','Lab50 TA7767','Teenage Dream','8857128011096','EDP','50 ml.','01_CTW - Central Word','Receive'),
(228,'2025-11-20','WPO251120001','Lab50 TA7764','Teenage Dream','8857128011096','EDP','50 ml.','01_CTW - Central Word','Receive'),
(229,'2025-11-20','WPO251120001','Lab50 TA7769','Teenage Dream','8857128011096','EDP','50 ml.','01_CTW - Central Word','Receive'),
(230,'2025-11-20','WPO251120001','Lab50 TA7768','Teenage Dream','8857128011096','EDP','50 ml.','01_CTW - Central Word','Receive'),
(231,'2025-11-20','WPO251120001','Lab50 TA7582','Hercules','8857128011034','EDP','50 ml.','01_CTW - Central Word','Receive'),
(232,'2025-11-20','WPO251120001','Lab50 TA7581','Hercules','8857128011034','EDP','50 ml.','01_CTW - Central Word','Receive'),
(233,'2025-11-20','WPO251120001','Lab50 TA7583','Hercules','8857128011034','EDP','50 ml.','01_CTW - Central Word','Receive'),
(234,'2025-11-20','WPO251120001','Lab50 TA7578','Hercules','8857128011034','EDP','50 ml.','01_CTW - Central Word','Receive'),
(235,'2025-11-20','WPO251120001','Lab50 TA7580','Hercules','8857128011034','EDP','50 ml.','01_CTW - Central Word','Receive'),
(236,'2025-11-20','WPO251120001','Lab50 TA7820','Blind Magnolia','8857128011225','EDP','50 ml.','01_CTW - Central Word','Receive'),
(237,'2025-11-20','WPO251120001','Lab50 TA7818','Blind Magnolia','8857128011225','EDP','50 ml.','01_CTW - Central Word','Receive'),
(238,'2025-11-20','WPO251120001','Lab50 TA7817','Blind Magnolia','8857128011225','EDP','50 ml.','01_CTW - Central Word','Receive'),
(239,'2025-11-20','WPO251120001','Lab50 TA7821','Blind Magnolia','8857128011225','EDP','50 ml.','01_CTW - Central Word','Receive'),
(240,'2025-11-20','WPO251120001','Lab50 TA7819','Blind Magnolia','8857128011225','EDP','50 ml.','01_CTW - Central Word','Receive'),
(241,'2025-11-20','WPO251120001','Lab50 TA7592','Victory','8857128011164','EDP','50 ml.','01_CTW - Central Word','Receive'),
(242,'2025-11-20','WPO251120001','Lab50 TA7591','Victory','8857128011164','EDP','50 ml.','01_CTW - Central Word','Receive'),
(243,'2025-11-20','WPO251120001','Lab50 TA7589','Victory','8857128011164','EDP','50 ml.','01_CTW - Central Word','Receive'),
(244,'2025-11-20','WPO251120001','Lab50 TA7588','Victory','8857128011164','EDP','50 ml.','01_CTW - Central Word','Receive'),
(245,'2025-11-20','WPO251120001','Lab50 TA7590','Victory','8857128011164','EDP','50 ml.','01_CTW - Central Word','Receive'),
(246,'2025-11-20','WPO251120001','Lab50 TA7786','Shadow De Bacci Light','8857128011294','EDP','50 ml.','01_CTW - Central Word','Receive'),
(247,'2025-11-20','WPO251120001','Lab50 TA7794','Shadow De Bacci Light','8857128011294','EDP','50 ml.','01_CTW - Central Word','Receive'),
(248,'2025-11-20','WPO251120001','Lab50 TA7787','Shadow De Bacci Light','8857128011294','EDP','50 ml.','01_CTW - Central Word','Receive'),
(249,'2025-11-20','WPO251120001','Lab50 TA7789','Shadow De Bacci Light','8857128011294','EDP','50 ml.','01_CTW - Central Word','Receive'),
(250,'2025-11-20','WPO251120001','Lab50 TA7785','Shadow De Bacci Light','8857128011294','EDP','50 ml.','01_CTW - Central Word','Receive'),
(251,'2025-11-20','WPO251120001','Lab50 TA7485','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(252,'2025-11-20','WPO251120001','Lab50 TA7473','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(253,'2025-11-20','WPO251120001','Lab50 TA7476','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(254,'2025-11-20','WPO251120001','Lab50 TA7474','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(255,'2025-11-20','WPO251120001','Lab50 TA7496','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(256,'2025-11-20','WPO251120001','Lab50 TA7472','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(257,'2025-11-20','WPO251120001','Lab50 TA7477','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(258,'2025-11-20','WPO251120001','Lab50 TA7481','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(259,'2025-11-20','WPO251120001','Lab50 TA7487','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(260,'2025-11-20','WPO251120001','Lab50 TA7482','Persist','8857128011041','EDP','50 ml.','01_CTW - Central Word','Receive'),
(261,'2025-11-20','WPO251120001','Lab50 TA5016','Make Way','8857128012020','EDP','50 ml.','01_CTW - Central Word','Receive'),
(262,'2025-11-20','WPO251120001','Lab50 TA5022','Make Way','8857128012020','EDP','50 ml.','01_CTW - Central Word','Receive'),
(263,'2025-11-20','WPO251120001','Lab50 TA5017','Make Way','8857128012020','EDP','50 ml.','01_CTW - Central Word','Receive'),
(264,'2025-11-20','WPO251120001','Lab50 TA5024','Make Way','8857128012020','EDP','50 ml.','01_CTW - Central Word','Receive'),
(265,'2025-11-20','WPO251120001','Lab50 TA5019','Make Way','8857128012020','EDP','50 ml.','01_CTW - Central Word','Receive'),
(266,'2025-11-20','WPO251120001','Lab50 TA8185','1000Thousand','8857128011188','EDP','50 ml.','01_CTW - Central Word','Receive'),
(267,'2025-11-20','WPO251120001','Lab50 TA8188','1000Thousand','8857128011188','EDP','50 ml.','01_CTW - Central Word','Receive'),
(268,'2025-11-20','WPO251120001','Lab50 TA8186','1000Thousand','8857128011188','EDP','50 ml.','01_CTW - Central Word','Receive'),
(269,'2025-11-20','WPO251120001','Lab50 TA8187','1000Thousand','8857128011188','EDP','50 ml.','01_CTW - Central Word','Receive'),
(270,'2025-11-20','WPO251120001','Lab50 TA8189','1000Thousand','8857128011188','EDP','50 ml.','01_CTW - Central Word','Receive'),
(271,'2025-11-20','WPO251120001','Lab0101225TQ0446','Blackest Black','8857128011669','EDP+','50 ml.','01_CTW - Central Word','Receive'),
(272,'2025-11-20','WPO251120001','Lab0101225TQ0451','Blackest Black','8857128011669','EDP+','50 ml.','01_CTW - Central Word','Receive'),
(273,'2025-11-20','WPO251120001','Lab0101225TQ0468','Sparkling Mandarin','8857128011713','EDP+','50 ml.','01_CTW - Central Word','Receive'),
(274,'2025-11-20','WPO251120001','Lab0101225TQ0466','Sparkling Mandarin','8857128011713','EDP+','50 ml.','01_CTW - Central Word','Receive'),
(275,'2025-11-20','WPO251120001','Lab50 TA6000','Gambling 34+35','8857128011591','PARFUM','50 ml.','01_CTW - Central Word','Receive'),
(276,'2025-11-20','WPO251120001','Lab50 TA6004','Gambling 34+35','8857128011591','PARFUM','50 ml.','01_CTW - Central Word','Receive'),
(277,'2025-11-20','WPO251120001','Lab50 TA6006','Gambling 34+35','8857128011591','PARFUM','50 ml.','01_CTW - Central Word','Receive'),
(278,'2025-11-20','WPO251120001','Lab50 TA5981','Gambling 34+35','8857128011591','PARFUM','50 ml.','01_CTW - Central Word','Receive'),
(279,'2025-11-20','WPO251120001','Lab50 TA5979','Gambling 34+35','8857128011591','PARFUM','50 ml.','01_CTW - Central Word','Receive'),
(280,'2025-11-20','WPO251120002','Lab30 TA8186','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(281,'2025-11-20','WPO251120002','Lab30 TA8188','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(282,'2025-11-20','WPO251120002','Lab30 TA8195','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(283,'2025-11-20','WPO251120002','Lab30 TA8193','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(284,'2025-11-20','WPO251120002','Lab30 TA8187','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(285,'2025-11-20','WPO251120002','Lab30 TA8192','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(286,'2025-11-20','WPO251120002','Lab30 TA8189','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(287,'2025-11-20','WPO251120002','Lab30 TA8190','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(288,'2025-11-20','WPO251120002','Lab30 TA8200','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(289,'2025-11-20','WPO251120002','Lab30 TA8191','Persist','8857128011881','EDP','30 ml.','01_CTW - Central Word','Receive'),
(290,'2025-11-20','WPO251120002','Lab30 TA8369','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(291,'2025-11-20','WPO251120002','Lab30 TA8373','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(292,'2025-11-20','WPO251120002','Lab30 TA8374','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(293,'2025-11-20','WPO251120002','Lab30 TA8375','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(294,'2025-11-20','WPO251120002','Lab30 TA8367','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(295,'2025-11-20','WPO251120002','Lab30 TA8372','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(296,'2025-11-20','WPO251120002','Lab30 TA8368','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(297,'2025-11-20','WPO251120002','Lab30 TA8371','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(298,'2025-11-20','WPO251120002','Lab30 TA8366','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(299,'2025-11-20','WPO251120002','Lab30 TA8370','Senorita','8857128011967',null,null,'01_CTW - Central Word','Receive'),
(300,'2025-11-20','WPO251120002','Lab30 TA8100','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(301,'2025-11-20','WPO251120002','Lab30 TA8103','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(302,'2025-11-20','WPO251120002','Lab30 TA8104','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(303,'2025-11-20','WPO251120002','Lab30 TA8102','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(304,'2025-11-20','WPO251120002','Lab30 TA8105','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(305,'2025-11-20','WPO251120002','Lab30 TA8101','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(306,'2025-11-20','WPO251120002','Lab30 TA8099','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(307,'2025-11-20','WPO251120002','Lab30 TA8096','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(308,'2025-11-20','WPO251120002','Lab30 TA8106','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(309,'2025-11-20','WPO251120002','Lab30 TA8097','Dream Island','8857128011874','EDP','30 ml.','01_CTW - Central Word','Receive'),
(310,'2025-11-20','WPO251120002','Lab30 TA8173','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(311,'2025-11-20','WPO251120002','Lab30 TA8172','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(312,'2025-11-20','WPO251120002','Lab30 TA8174','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(313,'2025-11-20','WPO251120002','Lab30 TA8169','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(314,'2025-11-20','WPO251120002','Lab30 TA8169','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(315,'2025-11-20','WPO251120002','Lab30 TA8170','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(316,'2025-11-20','WPO251120002','Lab30 TA8165','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(317,'2025-11-20','WPO251120002','Lab30 TA8166','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(318,'2025-11-20','WPO251120002','Lab30 TA8168','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(319,'2025-11-20','WPO251120002','Lab30 TA8167','La Belle','8857128011904','EDP','30 ml.','01_CTW - Central Word','Receive'),
(320,'2025-11-20','WPO251120002','Lab30 TA8202','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(321,'2025-11-20','WPO251120002','Lab30 TA8416','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(322,'2025-11-20','WPO251120002','Lab30 TA8203','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(323,'2025-11-20','WPO251120002','Lab30 TA8204','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(324,'2025-11-20','WPO251120002','Lab30 TA8420','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(325,'2025-11-20','WPO251120002','Lab30 TA8201','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(326,'2025-11-20','WPO251120002','Lab30 TA8419','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(327,'2025-11-20','WPO251120002','Lab30 TA8205','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(328,'2025-11-20','WPO251120002','Lab30 TA8418','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(329,'2025-11-20','WPO251120002','Lab30 TA8417','Voyage','8857128012023','EDP','30 ml.','01_CTW - Central Word','Receive'),
(330,'2025-11-20','WPO251120002','Lab30 TA8345','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(331,'2025-11-20','WPO251120002','Lab30 TA8347','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(332,'2025-11-20','WPO251120002','Lab30 TA8344','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(333,'2025-11-20','WPO251120002','Lab30 TA8349','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(334,'2025-11-20','WPO251120002','Lab30 TA8346','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(335,'2025-11-20','WPO251120002','Lab30 TA8350','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(336,'2025-11-20','WPO251120002','Lab30 TA8348','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(337,'2025-11-20','WPO251120002','Lab30 TA8343','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(338,'2025-11-20','WPO251120002','Lab30 TA8339','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(339,'2025-11-20','WPO251120002','Lab30 TA8342','Sicilia','8857128011911','EDP','30 ml.','01_CTW - Central Word','Receive'),
(340,'2025-11-20','WPO251120002','Lab30 TA8230','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(341,'2025-11-20','WPO251120002','Lab30 TA8232','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(342,'2025-11-20','WPO251120002','Lab30 TA8231','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(343,'2025-11-20','WPO251120002','Lab30 TA8228','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(344,'2025-11-20','WPO251120002','Lab30 TA8227','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(345,'2025-11-20','WPO251120002','Lab30 TA8235','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(346,'2025-11-20','WPO251120002','Lab30 TA8229','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(347,'2025-11-20','WPO251120002','Lab30 TA8234','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(348,'2025-11-20','WPO251120002','Lab30 TA8233','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(349,'2025-11-20','WPO251120002','Lab30 TA8226','VirginX','8857128011997','EDP','30 ml.','01_CTW - Central Word','Receive'),
(350,'2025-11-20','WPO251120002','Lab30 TA8213','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(351,'2025-11-20','WPO251120002','Lab30 TA8211','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(352,'2025-11-20','WPO251120002','Lab30 TA8224','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(353,'2025-11-20','WPO251120002','Lab30 TA8220','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(354,'2025-11-20','WPO251120002','Lab30 TA8225','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(355,'2025-11-20','WPO251120002','Lab30 TA8214','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(356,'2025-11-20','WPO251120002','Lab30 TA8223','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(357,'2025-11-20','WPO251120002','Lab30 TA8215','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(358,'2025-11-20','WPO251120002','Lab30 TA8222','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(359,'2025-11-20','WPO251120002','Lab30 TA8212','Aqua','8857128012022','EDP','30 ml.','01_CTW - Central Word','Receive'),
(360,'2025-11-20','WPO251120002','Lab30 TA8241','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(361,'2025-11-20','WPO251120002','Lab30 TA8244','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(362,'2025-11-20','WPO251120002','Lab30 TA8242','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(363,'2025-11-20','WPO251120002','Lab30 TA8248','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(364,'2025-11-20','WPO251120002','Lab30 TA8254','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(365,'2025-11-20','WPO251120002','Lab30 TA8243','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(366,'2025-11-20','WPO251120002','Lab30 TA8245','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(367,'2025-11-20','WPO251120002','Lab30 TA8250','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(368,'2025-11-20','WPO251120002','Lab30 TA8247','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(369,'2025-11-20','WPO251120002','Lab30 TA8246','Beyond','8857128012031','EDP','30 ml.','01_CTW - Central Word','Receive'),
(370,'2025-11-20','WPO251120002','Lab30 TA8405','Victory','8857128011430','EDP','30 ml.','01_CTW - Central Word','Receive'),
(371,'2025-11-20','WPO251120002','Lab30 TA8396','Victory','8857128011430','EDP','30 ml.','01_CTW - Central Word','Receive'),
(372,'2025-11-20','WPO251120002','Lab30 TA8398','Victory','8857128011430','EDP','30 ml.','01_CTW - Central Word','Receive'),
(373,'2025-11-20','WPO251120002','Lab30 TA8399','Victory','8857128011430','EDP','30 ml.','01_CTW - Central Word','Receive'),
(374,'2025-11-20','WPO251120002','Lab30 TA8397','Victory','8857128011430','EDP','30 ml.','01_CTW - Central Word','Receive'),
(375,'2025-11-20','WPO251120002','Lab30 TA8279','DionysusX','8857128012086','EDP','30 ml.','01_CTW - Central Word','Receive'),
(376,'2025-11-20','WPO251120002','Lab30 TA8276','DionysusX','8857128012086','EDP','30 ml.','01_CTW - Central Word','Receive'),
(377,'2025-11-20','WPO251120002','Lab30 TA8277','DionysusX','8857128012086','EDP','30 ml.','01_CTW - Central Word','Receive'),
(378,'2025-11-20','WPO251120002','Lab30 TA8280','DionysusX','8857128012086','EDP','30 ml.','01_CTW - Central Word','Receive'),
(379,'2025-11-20','WPO251120002','Lab30 TA8278','DionysusX','8857128012086','EDP','30 ml.','01_CTW - Central Word','Receive'),
(380,'2025-11-20','WPO251120002','Lab30 TA8431','Excalibur (EDP)','8857128011935','EDP','30 ml.','01_CTW - Central Word','Receive'),
(381,'2025-11-20','WPO251120002','Lab30 TA8433','Excalibur (EDP)','8857128011935','EDP','30 ml.','01_CTW - Central Word','Receive'),
(382,'2025-11-20','WPO251120002','Lab30 TA8440','Excalibur (EDP)','8857128011935','EDP','30 ml.','01_CTW - Central Word','Receive'),
(383,'2025-11-20','WPO251120002','Lab30 TA8438','Excalibur (EDP)','8857128011935','EDP','30 ml.','01_CTW - Central Word','Receive'),
(384,'2025-11-20','WPO251120002','Lab30 TA8439','Excalibur (EDP)','8857128011935','EDP','30 ml.','01_CTW - Central Word','Receive'),
(385,'2025-11-20','WPO251120002','Lab30 TA8354','Blind Magnolia','8857128012064','EDP','30 ml.','01_CTW - Central Word','Receive'),
(386,'2025-11-20','WPO251120002','Lab30 TA8351','Blind Magnolia','8857128012064','EDP','30 ml.','01_CTW - Central Word','Receive'),
(387,'2025-11-20','WPO251120002','Lab30 TA8353','Blind Magnolia','8857128012064','EDP','30 ml.','01_CTW - Central Word','Receive'),
(388,'2025-11-20','WPO251120002','Lab30 TA8352','Blind Magnolia','8857128012064','EDP','30 ml.','01_CTW - Central Word','Receive'),
(389,'2025-11-20','WPO251120002','Lab30 TA8355','Blind Magnolia','8857128012064','EDP','30 ml.','01_CTW - Central Word','Receive'),
(390,'2025-11-20','WPO251120002','Lab30 TA8177','Vivid','8857128011898','EDP','30 ml.','01_CTW - Central Word','Receive'),
(391,'2025-11-20','WPO251120002','Lab30 TA8178','Vivid','8857128011898','EDP','30 ml.','01_CTW - Central Word','Receive'),
(392,'2025-11-20','WPO251120002','Lab30 TA8185','Vivid','8857128011898','EDP','30 ml.','01_CTW - Central Word','Receive'),
(393,'2025-11-20','WPO251120002','Lab30 TA8181','Vivid','8857128011898','EDP','30 ml.','01_CTW - Central Word','Receive'),
(394,'2025-11-20','WPO251120002','Lab30 TA8180','Vivid','8857128011898','EDP','30 ml.','01_CTW - Central Word','Receive'),
(395,'2025-11-20','WPO251120002','Lab30 TA8179','Vivid','8857128011898','EDP','30 ml.','01_CTW - Central Word','Receive'),
(396,'2025-11-20','WPO251120002','Lab30 TA8176','Vivid','8857128011898','EDP','30 ml.','01_CTW - Central Word','Receive'),
(397,'2025-11-20','WPO251120002','Lab30 TA8383','Buoyant','8857128012025','EDP','30 ml.','01_CTW - Central Word','Receive'),
(398,'2025-11-20','WPO251120002','Lab30 TA8384','Buoyant','8857128012025','EDP','30 ml.','01_CTW - Central Word','Receive'),
(399,'2025-11-20','WPO251120002','Lab30 TA8385','Buoyant','8857128012025','EDP','30 ml.','01_CTW - Central Word','Receive'),
(400,'2025-11-20','WPO251120002','Lab30 TA8381','Buoyant','8857128012025','EDP','30 ml.','01_CTW - Central Word','Receive'),
(401,'2025-11-20','WPO251120002','Lab30 TA8382','Buoyant','8857128012025','EDP','30 ml.','01_CTW - Central Word','Receive'),
(402,'2025-11-20','WPO251120002','Lab30 TA8380','Teenage Dream','8857128012069','EDP','30 ml.','01_CTW - Central Word','Receive'),
(403,'2025-11-20','WPO251120002','Lab30 TA8376','Teenage Dream','8857128012069','EDP','30 ml.','01_CTW - Central Word','Receive'),
(404,'2025-11-20','WPO251120002','Lab30 TA8378','Teenage Dream','8857128012069','EDP','30 ml.','01_CTW - Central Word','Receive'),
(405,'2025-11-20','WPO251120002','Lab30 TA8379','Teenage Dream','8857128012069','EDP','30 ml.','01_CTW - Central Word','Receive'),
(406,'2025-11-20','WPO251120002','Lab30 TA8322','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(407,'2025-11-20','WPO251120002','Lab30 TA8324','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(408,'2025-11-20','WPO251120002','Lab30 TA8318','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(409,'2025-11-20','WPO251120002','Lab30 TA8320','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(410,'2025-11-20','WPO251120002','Lab30 TA8325','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(411,'2025-11-20','WPO251120002','Lab30 TA8323','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(412,'2025-11-20','WPO251120002','Lab30 TA8316','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(413,'2025-11-20','WPO251120002','Lab30 TA8319','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(414,'2025-11-20','WPO251120002','Lab30 TA8321','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(415,'2025-11-20','WPO251120002','Lab30 TA8317','Zeus','8857128011843','EDP','30 ml.','01_CTW - Central Word','Receive'),
(416,'2025-11-20','WPO251120002','Lab30 TA8292','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(417,'2025-11-20','WPO251120002','Lab30 TA8302','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(418,'2025-11-20','WPO251120002','Lab30 TA8295','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(419,'2025-11-20','WPO251120002','Lab30 TA8293','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(420,'2025-11-20','WPO251120002','Lab30 TA8294','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(421,'2025-11-20','WPO251120002','Lab30 TA8304','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(422,'2025-11-20','WPO251120002','Lab30 TA8305','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(423,'2025-11-20','WPO251120002','Lab30 TA8291','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(424,'2025-11-20','WPO251120002','Lab30 TA8303','Never Blue','8857128011836','EDP','30 ml.','01_CTW - Central Word','Receive'),
(425,'2025-11-20','WPO251120002','Lab30 TA8143','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(426,'2025-11-20','WPO251120002','Lab30 TA8137','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(427,'2025-11-20','WPO251120002','Lab30 TA8146','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(428,'2025-11-20','WPO251120002','Lab30 TA8138','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(429,'2025-11-20','WPO251120002','Lab30 TA8141','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(430,'2025-11-20','WPO251120002','Lab30 TA8136','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(431,'2025-11-20','WPO251120002','Lab30 TA8139','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(432,'2025-11-20','WPO251120002','Lab30 TA8140','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(433,'2025-11-20','WPO251120002','Lab30 TA8142','Secret of Peach','8857128011850','EDP','30 ml.','01_CTW - Central Word','Receive'),
(434,'2025-11-20','WPO251120002','Lab30 TA8261','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(435,'2025-11-20','WPO251120002','Lab30 TA8257','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(436,'2025-11-20','WPO251120002','Lab30 TA8260','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(437,'2025-11-20','WPO251120002','Lab30 TA8262','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(438,'2025-11-20','WPO251120002','Lab30 TA8259','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(439,'2025-11-20','WPO251120002','Lab30 TA8265','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(440,'2025-11-20','WPO251120002','Lab30 TA8264','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(441,'2025-11-20','WPO251120002','Lab30 TA8263','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(442,'2025-11-20','WPO251120002','Lab30 TA8258','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(443,'2025-11-20','WPO251120002','Lab30 TA8256','Velvet Oud','8857128012048','EDP','30 ml.','01_CTW - Central Word','Receive'),
(444,'2025-11-20','WPO251120002','Lab30 TA8411','Dynasty','8857128011812','EDP','30 ml.','01_CTW - Central Word','Receive'),
(445,'2025-11-20','WPO251120002','Lab30 TA8410','Dynasty','8857128011812','EDP','30 ml.','01_CTW - Central Word','Receive'),
(446,'2025-11-20','WPO251120002','Lab30 TA8284','Make Way','8857128012024','EDP','30 ml.','01_CTW - Central Word','Receive'),
(447,'2025-11-20','WPO251120002','Lab30 TA8284','Make Way','8857128012024','EDP','30 ml.','01_CTW - Central Word','Receive'),
(448,'2025-11-20','WPO251120002','Lab30 TA8282','Make Way','8857128012024','EDP','30 ml.','01_CTW - Central Word','Receive'),
(449,'2025-11-20','WPO251120002','Lab30 TA8281','Make Way','8857128012024','EDP','30 ml.','01_CTW - Central Word','Receive'),
(450,'2025-11-20','WPO251120002','Lab30 TA8283','Make Way','8857128012024','EDP','30 ml.','01_CTW - Central Word','Receive'),
(451,'2025-11-20','WPO251120002','Lab30 TA8330','Eden','8857128012057','EDP','30 ml.','01_CTW - Central Word','Receive'),
(452,'2025-11-20','WPO251120002','Lab30 TA8333','Eden','8857128012057','EDP','30 ml.','01_CTW - Central Word','Receive'),
(453,'2025-11-20','WPO251120002','Lab30 TA8334','Eden','8857128012057','EDP','30 ml.','01_CTW - Central Word','Receive'),
(454,'2025-11-20','WPO251120002','Lab30 TA8326','Eden','8857128012057','EDP','30 ml.','01_CTW - Central Word','Receive'),
(455,'2025-11-20','WPO251120002','Lab30 TA8335','Eden','8857128012057','EDP','30 ml.','01_CTW - Central Word','Receive'),
(456,'2025-11-20','WPO251120002','Lab30 TA8331','Eden','8857128012057','EDP','30 ml.','01_CTW - Central Word','Receive'),
(457,'2025-11-20','WPO251120002','Lab30 TA8332','Eden','8857128012057','EDP','30 ml.','01_CTW - Central Word','Receive'),
(458,'2025-11-20','WPO251120002','Lab30 TA8329','Eden','8857128012057','EDP','30 ml.','01_CTW - Central Word','Receive'),
(459,'2025-11-20','WPO251120002','Lab30 TA8389','Hercules','8857128011737','EDP','30 ml.','01_CTW - Central Word','Receive'),
(460,'2025-11-20','WPO251120002','Lab30 TA8391','Hercules','8857128011737','EDP','30 ml.','01_CTW - Central Word','Receive'),
(461,'2025-11-20','WPO251120002','Lab30 TA8394','Hercules','8857128011737','EDP','30 ml.','01_CTW - Central Word','Receive'),
(462,'2025-11-20','WPO251120002','Lab30 TA8392','Hercules','8857128011737','EDP','30 ml.','01_CTW - Central Word','Receive'),
(463,'2025-11-20','WPO251120002','Lab30 TA8390','Hercules','8857128011737','EDP','30 ml.','01_CTW - Central Word','Receive'),
(464,'2025-11-20','WPO251120002','Lab30 TA8272','1000Thousand','8857128012050','EDP','30 ml.','01_CTW - Central Word','Receive'),
(465,'2025-11-20','WPO251120002','Lab30 TA8274','1000Thousand','8857128012050','EDP','30 ml.','01_CTW - Central Word','Receive'),
(466,'2025-11-20','WPO251120002','Lab30 TA8271','1000Thousand','8857128012050','EDP','30 ml.','01_CTW - Central Word','Receive'),
(467,'2025-11-20','WPO251120002','Lab30 TA8275','1000Thousand','8857128012050','EDP','30 ml.','01_CTW - Central Word','Receive'),
(468,'2025-11-20','WPO251120002','Lab30 TA8273','1000Thousand','8857128012050','EDP','30 ml.','01_CTW - Central Word','Receive'),
(469,'2025-11-20','WPO251120002','Lab0101223TQ0880','Blackest Black','8857128012005','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(470,'2025-11-20','WPO251120002','Lab0101223TQ0740','Blackest Black','8857128012005','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(471,'2025-11-20','WPO251120002','Lab0101223TQ0851','Blackest Black','8857128012005','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(472,'2025-11-20','WPO251120002','Lab0101223TQ0254','Blackest Black','8857128012005','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(473,'2025-11-20','WPO251120002','Lab0101223TQ0872','Blackest Black','8857128012005','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(474,'2025-11-20','WPO251120002','Lab0101223TQ0863','Sparkling Mandarin','8857128012010','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(475,'2025-11-20','WPO251120002','Lab0101223TQ0597','Sparkling Mandarin','8857128012010','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(476,'2025-11-20','WPO251120002','Lab0101223TQ0885','Sparkling Mandarin','8857128012010','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(477,'2025-11-20','WPO251120002','Lab0101223TQ0733','Sparkling Mandarin','8857128012010','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(478,'2025-11-20','WPO251120002','Lab0101223TQ0883','Sparkling Mandarin','8857128012010','EDP+','30 ml.','01_CTW - Central Word','Receive'),
(479,'2025-11-20','WPO251120003','LTS7845','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(480,'2025-11-20','WPO251120003','LTS7831','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(481,'2025-11-20','WPO251120003','LTS7829','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(482,'2025-11-20','WPO251120003','LTS7850','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(483,'2025-11-20','WPO251120003','LTS7834','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(484,'2025-11-20','WPO251120003','LTS7844','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(485,'2025-11-20','WPO251120003','LTS7849','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(486,'2025-11-20','WPO251120003','LTS7840','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(487,'2025-11-20','WPO251120003','LTS7847','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(488,'2025-11-20','WPO251120003','LTS7841','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(489,'2025-11-20','WPO251120003','LTS7836','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(490,'2025-11-20','WPO251120003','LTS7838','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(491,'2025-11-20','WPO251120003','LTS7848','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(492,'2025-11-20','WPO251120003','LTS7846','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(493,'2025-11-20','WPO251120003','LTS7835','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(494,'2025-11-20','WPO251120003','LTS7839','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(495,'2025-11-20','WPO251120003','LTS7827','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(496,'2025-11-20','WPO251120003','LTS7842','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(497,'2025-11-20','WPO251120003','LTS7828','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(498,'2025-11-20','WPO251120003','LTS7837','VirginX','8857128012053','EDP','10 ml.','01_CTW - Central Word','Receive'),
(499,'2025-11-20','WPO251120003','LTS6778','Sicilia','8857128012055','EDP','10 ml.','01_CTW - Central Word','Receive'),
(500,'2025-11-20','WPO251120003','LTS8188','Sicilia','8857128012055','EDP','10 ml.','01_CTW - Central Word','Receive');
commit;

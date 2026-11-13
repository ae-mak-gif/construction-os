-- BuildFlow controlled operational pilot dataset
-- Development project only: amqknbijdjpcapwkeyyh
-- All records are synthetic, linked, and visibly labelled PILOT/UAT.
-- Safe to re-run: stable IDs and business numbers are used; no production data is touched.
begin;

-- Give the three existing UAT journeys distinct construction scenarios.
update public.projects set
  name='UAT-01 | Residential Housing Development',
  description='PILOT/UAT synthetic scenario: 24-unit residential development. Use for programme, BOQ, site diary, budget and progress acceptance.',
  location='Borrowdale, Harare',
  status='active', health_status='on_track', start_date='2026-10-01',
  expected_completion_date='2027-06-30', contract_value=185000,
  progress_percent=28, updated_at=now()
where id='25e4a504-1805-4fbc-a250-41ef4e64f4eb';

update public.projects set
  name='UAT-02 | Commercial Office Fit-Out',
  description='PILOT/UAT synthetic scenario: multi-floor office fit-out with procurement, supplier, PO and staged goods receipt acceptance.',
  location='Eastlea, Harare',
  status='active', health_status='at_risk', start_date='2026-08-15',
  expected_completion_date='2027-02-28', contract_value=420000,
  progress_percent=62, updated_at=now()
where id='e4fcc82e-adcd-4b09-a470-ed4527dd5082';

update public.projects set
  name='UAT-03 | Road and Drainage Upgrade',
  description='PILOT/UAT synthetic scenario: urban road and drainage works with budget control, invoice/payment, delay and variation acceptance.',
  location='Chitungwiza, Zimbabwe',
  status='active', health_status='at_risk', start_date='2026-09-01',
  expected_completion_date='2027-04-30', contract_value=310000,
  progress_percent=38, updated_at=now()
where id='2937b153-37fb-4660-bc84-977d6b454d7f';

-- Programme and site execution: Project 01.
insert into public.schedule_activities
(id,organization_id,project_id,activity_code,name,description,planned_start,planned_finish,duration_days,progress_percent,status,sequence_order,is_milestone,created_by)
values
('a1000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','UAT01-01','Substructure and foundations','PILOT/UAT: excavation, reinforcement, formwork and concrete foundations.','2026-10-01','2026-11-15',46,100,'completed',1,false,'ad02abe2-abee-45ea-82de-dac8b639489e'),
('a1000000-0000-4000-8000-000000000002','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','UAT01-02','Ground-floor superstructure','PILOT/UAT: blockwork, columns and suspended slab.','2026-11-16','2026-12-20',35,35,'in_progress',2,false,'ad02abe2-abee-45ea-82de-dac8b639489e'),
('a1000000-0000-4000-8000-000000000003','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','UAT01-03','Roofing and weatherproofing','PILOT/UAT: roof structure, covering and waterproofing.','2026-12-21','2027-01-25',36,0,'not_started',3,true,'ad02abe2-abee-45ea-82de-dac8b639489e')
on conflict (id) do nothing;

insert into public.site_diaries
(id,organization_id,project_id,diary_date,weather_conditions,site_conditions,work_performed,labour_count,plant_equipment,materials_delivered,delays_disruptions,instructions_received,safety_observations,created_by)
values
('a2000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','2026-11-12','Warm, partly cloudy','Ground firm; access clear','PILOT/UAT: reinforcement fixing and ground-floor blockwork progressed in gridlines A-C.',24,'1 excavator, 1 concrete mixer, 2 compactors','Cement 120 bags; 12 mm reinforcement 2.4 tonnes','No material delay recorded','Engineer instructed additional inspection before slab pour.','Toolbox talk completed; PPE compliance checked.','2d06b23a-dece-4b88-9c95-ca6165bb7eb7')
on conflict (id) do nothing;

-- BOQ and cost plan: Project 01.
insert into public.boq_items
(id,organization_id,project_id,item_code,category,description,quantity,unit,unit_rate,total_amount,status,notes)
values
('a3000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','UAT01-BOQ-001','Concrete','Ready-mix concrete 25 MPa for foundations and slabs',420,'m3',145,60900,'approved','PILOT/UAT synthetic quantity and rate; not a supplier quotation.'),
('a3000000-0000-4000-8000-000000000002','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','UAT01-BOQ-002','Reinforcement','High-yield reinforcement steel',18500,'kg',1.65,30525,'planned','PILOT/UAT synthetic quantity and rate.'),
('a3000000-0000-4000-8000-000000000003','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','UAT01-BOQ-003','Masonry','Concrete blocks including laying',28000,'each',1.15,32200,'planned','PILOT/UAT synthetic quantity and rate.')
on conflict (id) do nothing;

insert into public.project_budgets
(id,organization_id,project_id,cost_code,description,budget_amount,committed_amount,actual_amount,forecast_amount,currency_code,notes,created_by)
values
('a4000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','UAT01-CIVIL','Civil works and foundations',72000,18500,16400,73500,'USD','PILOT/UAT synthetic budget line.','ad02abe2-abee-45ea-82de-dac8b639489e'),
('a4000000-0000-4000-8000-000000000002','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','UAT01-STRUCT','Structural frame and masonry',65000,12000,7800,68400,'USD','PILOT/UAT synthetic budget line.','ad02abe2-abee-45ea-82de-dac8b639489e')
on conflict (id) do nothing;

-- Supplier and procurement chain: Project 02.
insert into public.suppliers
(id,organization_id,name,supplier_code,contact_name,email,phone,address,status,payment_terms,notes)
values
('a5000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','UAT Build Supplies (Synthetic)','UAT-SUP-001','Demo Procurement Contact','procurement@example.invalid','+263000000001','Harare, Zimbabwe','active','30 days','PILOT/UAT only. Fictional supplier; no orders may be dispatched.')
on conflict (id) do nothing;

insert into public.boq_items
(id,organization_id,project_id,item_code,category,description,quantity,unit,unit_rate,total_amount,status,notes)
values
('a3000000-0000-4000-8000-000000000004','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','e4fcc82e-adcd-4b09-a470-ed4527dd5082','UAT02-BOQ-001','Electrical','LED recessed office light fittings',180,'each',38,6840,'approved','PILOT/UAT synthetic procurement test item.')
on conflict (id) do nothing;

insert into public.purchase_requests
(id,organization_id,project_id,requested_by,request_number,description,status,required_date,estimated_amount,notes)
values
('a6000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','e4fcc82e-adcd-4b09-a470-ed4527dd5082','9ce2bc2d-c22f-4f04-b98f-f942d4d95cba','UAT02-PR-001','PILOT/UAT: supply 180 LED recessed office light fittings','pending','2026-11-20',6840,'Synthetic test request linked to a draft test PO; no real purchase commitment.')
on conflict (id) do nothing;

insert into public.purchase_orders
(id,organization_id,project_id,supplier_id,purchase_request_id,po_number,status,order_date,expected_delivery_date,subtotal,tax_amount,total_amount,notes,created_by)
values
('a7000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','e4fcc82e-adcd-4b09-a470-ed4527dd5082','a5000000-0000-4000-8000-000000000001','a6000000-0000-4000-8000-000000000001','UAT02-PO-001','draft','2026-11-13','2026-11-20',6840,0,6840,'PILOT/UAT ONLY — do not send to supplier. Use to test partial and final goods receipt.','ad02abe2-abee-45ea-82de-dac8b639489e')
on conflict (id) do nothing;

insert into public.purchase_order_items
(id,organization_id,purchase_order_id,boq_item_id,description,quantity,unit,unit_price,total_price)
values
('a8000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','a7000000-0000-4000-8000-000000000001','a3000000-0000-4000-8000-000000000004','LED recessed office light fittings',180,'each',38,6840)
on conflict (id) do nothing;

insert into public.inventory_items
(id,organization_id,supplier_id,item_code,name,category,description,unit,quantity_on_hand,reorder_level,unit_cost,status,notes)
values
('a9000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','a5000000-0000-4000-8000-000000000001','UAT02-INV-001','LED recessed office light fitting','Electrical','PILOT/UAT stock item for partial/final receipt test.','each',0,40,38,'active','PILOT/UAT synthetic inventory. Expected receipts: 80 then 100.')
on conflict (id) do nothing;

-- Finance and variation scenarios: Project 03.
insert into public.project_budgets
(id,organization_id,project_id,cost_code,description,budget_amount,committed_amount,actual_amount,forecast_amount,currency_code,notes,created_by)
values
('a4000000-0000-4000-8000-000000000003','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','2937b153-37fb-4660-bc84-977d6b454d7f','UAT03-ROAD','Road formation and surfacing',145000,52000,47000,151000,'USD','PILOT/UAT synthetic budget line.','ad02abe2-abee-45ea-82de-dac8b639489e'),
('a4000000-0000-4000-8000-000000000004','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','2937b153-37fb-4660-bc84-977d6b454d7f','UAT03-DRAIN','Stormwater drainage',90000,28500,22000,96000,'USD','PILOT/UAT synthetic budget line.','ad02abe2-abee-45ea-82de-dac8b639489e')
on conflict (id) do nothing;

insert into public.invoices
(id,organization_id,project_id,client_id,invoice_number,status,issue_date,due_date,subtotal,tax_amount,total_amount,notes,created_by)
values
('aa000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','2937b153-37fb-4660-bc84-977d6b454d7f','2bc468ef-4d9c-4d05-8ccb-c77f1367954d','UAT03-INV-001','draft','2026-11-10','2026-12-10',42000,0,42000,'PILOT/UAT synthetic progress claim. No payment collection or external dispatch.','ad02abe2-abee-45ea-82de-dac8b639489e')
on conflict (id) do nothing;

insert into public.payments
(id,organization_id,invoice_id,project_id,client_id,payment_reference,amount,payment_date,payment_method,status,notes,received_by)
values
('ab000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','aa000000-0000-4000-8000-000000000001','2937b153-37fb-4660-bc84-977d6b454d7f','2bc468ef-4d9c-4d05-8ccb-c77f1367954d','UAT03-PAY-001',15000,'2026-11-13','bank_transfer','pending','PILOT/UAT only — pending test payment; not a real receipt.','7397c417-6398-465b-bb48-b8cddba01e45')
on conflict (id) do nothing;

insert into public.contract_variations
(id,organization_id,project_id,variation_number,title,description,reason,submitted_amount,status,submitted_at,created_by)
values
('ac000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','2937b153-37fb-4660-bc84-977d6b454d7f','UAT03-VAR-001','Additional stormwater culvert works','PILOT/UAT: additional culvert length and headwall protection following revised site survey.','Unforeseen ground conditions identified during excavation.',12500,'submitted','2026-11-12','2d06b23a-dece-4b88-9c95-ca6165bb7eb7')
on conflict (id) do nothing;

insert into public.site_diaries
(id,organization_id,project_id,diary_date,weather_conditions,site_conditions,work_performed,labour_count,plant_equipment,materials_delivered,delays_disruptions,instructions_received,safety_observations,created_by)
values
('a2000000-0000-4000-8000-000000000002','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','2937b153-37fb-4660-bc84-977d6b454d7f','2026-11-12','Heavy afternoon showers','Waterlogged shoulder and restricted access','PILOT/UAT: drainage excavation and formation works completed on the eastern section.',18,'1 excavator, 1 grader, 2 tipper trucks','Drainage pipes 24 lengths','Rain delayed compaction by one shift; wet subgrade requires re-test.','Resident Engineer requested revised drainage detail and compaction results.','Traffic control maintained; trench edge barricades inspected.','9ce2bc2d-c22f-4f04-b98f-f942d4d95cba')
on conflict (id) do nothing;

insert into public.project_updates
(id,organization_id,project_id,title,content,progress_percent,created_by)
values
('ad000000-0000-4000-8000-000000000001','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','25e4a504-1805-4fbc-a250-41ef4e64f4eb','PILOT/UAT — Weekly progress update','Foundations complete; ground-floor superstructure underway. Next milestone is suspended slab inspection.',28,'2d06b23a-dece-4b88-9c95-ca6165bb7eb7'),
('ad000000-0000-4000-8000-000000000002','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','e4fcc82e-adcd-4b09-a470-ed4527dd5082','PILOT/UAT — Procurement status','Office lighting package approved for test procurement. Goods receipt remains outstanding for the UAT exercise.',62,'2d06b23a-dece-4b88-9c95-ca6165bb7eb7'),
('ad000000-0000-4000-8000-000000000003','299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','2937b153-37fb-4660-bc84-977d6b454d7f','PILOT/UAT — Delay and variation notice','Rain affected compaction. Additional culvert works submitted for approval; progress remains under review.',38,'2d06b23a-dece-4b88-9c95-ca6165bb7eb7')
on conflict (id) do nothing;

-- Seed audit marker: one immutable event per scenario, identifying the dataset release.
insert into public.security_audit_events
(organization_id,actor_id,action,target_type,target_id,metadata)
values
('299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','ad02abe2-abee-45ea-82de-dac8b639489e','pilot.dataset_seeded','project','25e4a504-1805-4fbc-a250-41ef4e64f4eb',jsonb_build_object('dataset','BF-PILOT-OPS-2026-11-v1','scenario','residential','synthetic',true,'execution_method','controlled_development_seed')),
('299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','ad02abe2-abee-45ea-82de-dac8b639489e','pilot.dataset_seeded','project','e4fcc82e-adcd-4b09-a470-ed4527dd5082',jsonb_build_object('dataset','BF-PILOT-OPS-2026-11-v1','scenario','commercial_fitout','synthetic',true,'execution_method','controlled_development_seed')),
('299c0e9d-78f8-4ecf-a9c5-0b3de9c96fb6','ad02abe2-abee-45ea-82de-dac8b639489e','pilot.dataset_seeded','project','2937b153-37fb-4660-bc84-977d6b454d7f',jsonb_build_object('dataset','BF-PILOT-OPS-2026-11-v1','scenario','road_drainage','synthetic',true,'execution_method','controlled_development_seed'))
on conflict do nothing;

commit;
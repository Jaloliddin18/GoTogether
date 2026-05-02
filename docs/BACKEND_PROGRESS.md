# Backend Progress Context

## 1. Project direction
- This project is no longer real estate/Nestar Property.
- It is now a Smart Library/bookstore robot delivery system.
- Students can BORROW a library book delivered to their desk.
- Students can PURCHASE a commercial book delivered to reception.

## 2. Current backend domain model
- Book = catalog/product/bookstore data.
- BookInventory = physical stock source and robot pickup information.
- Robot = robot state and availability.
- Request = borrow/purchase delivery order.

## 3. Completed backend work
- AGENT role removed from API.
- Property API replaced by Book API.
- Book module supports catalog/book fields.
- BookInventory module added.
- Request module refactored to use BookInventory.
- BORROW flow tested in Postman.
- CANCEL request tested in Postman.
- PURCHASE flow tested in Postman.
- PURCHASE completion tested in Postman.
- Request error DTO nullability fixed.
- Book schema nested required syntax fixed.

## 4. Important behavior confirmed in Postman
- createBook works.
- createBookInventory works for LIBRARY and COMMERCIAL.
- createRobot works.
- BORROW request selects LIBRARY inventory and assigns robot.
- cancelRequest releases request/robot/inventory.
- PURCHASE request selects COMMERCIAL inventory and sends to RECEPTION.
- Completing PURCHASE changes paymentStatus to PAID.
- Completing PURCHASE increases bookSoldQuantity and releases robot to IDLE.

## 5. Current important IDs from test data
- Book ID: `69f662844d9e6330d4a5faa9`
- LIBRARY inventory ID: `69f664874d9e6330d4a5faae`
- COMMERCIAL inventory ID: `69f664b04d9e6330d4a5fab2`
- Robot ID: `69f6670e997c6e5d143bd0d5`
- robotId string: `robot_01`

## 6. Current known issue / cleanup
- Uploaded book images still use old `uploads/property` path. Later change to `uploads/book` or `uploads/books`.
- Request error currently returns object with null fields for successful requests; acceptable for now, but cleaner would be `error: null`.
- Need to confirm remaining uncommitted files if any:
- `apps/nestar-api/src/components/robot/robot.service.ts`
- `apps/nestar-api/src/libs/dto/book/book.ts`
- `apps/nestar-batch` may still contain old property/agent batch logic; not handled yet.

## 7. Next session plan
- First run `git status` and `git log --oneline -8`.
- Commit any remaining intentional changes if needed.
- Test BORROW completion.
- Create BORROW request.
- Update status to COMPLETED.
- Verify `bookReservedQuantity` decreases.
- Verify `bookBorrowedQuantity` increases.
- Verify robot returns to IDLE.
- Test no-stock case.
- Fix upload path from `uploads/property` to `uploads/book`.
- Create more demo books/inventories.
- Then start frontend book list/detail/request flow.

## 8. Commit message rule
- Only use `feat:` or `fix:`.
- Do not use `docs:`, `refactor:`, `chore:`, `test:`, or any other prefix.

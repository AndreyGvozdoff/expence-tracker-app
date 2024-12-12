import {AfterViewInit, ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, ViewChild} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {MatTableDataSource} from '@angular/material/table';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {LocalStorageService} from '../services/local-storage.service';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MatSort, Sort} from '@angular/material/sort';
import {Subscription} from 'rxjs';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import {MatChipInputEvent} from '@angular/material/chips';
import {ConfirmDialogComponent} from '../confirm-dialog/confirm-dialog.component';
import {MaterialModule} from '../material/material.module';
import {NgxMaskDirective} from 'ngx-mask';
import {Transaction} from '../interfaces/transaction';
import {TransactionFilterTypesEnum} from '../interfaces/transaction';

@Component({
  selector: 'app-transactionlist',
  providers: [provideNativeDateAdapter()],
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    NgxMaskDirective
  ],
  templateUrl: './transactionlist.component.html',
  standalone: true,
  styleUrl: './transactionlist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionlistComponent implements AfterViewInit, OnInit, OnDestroy {
  private fb: FormBuilder = inject(FormBuilder);
  private _liveAnnouncer: LiveAnnouncer = inject(LiveAnnouncer);
  private dialog: MatDialog = inject(MatDialog);
  private snackBar: MatSnackBar = inject(MatSnackBar);
  private localStorageService:LocalStorageService = inject(LocalStorageService);

  private getTransactionList$: Subscription = new Subscription();
  private filterByType$: Subscription = new Subscription();
  private index = 0;

  typeList: TransactionFilterTypesEnum[] = [TransactionFilterTypesEnum.Income, TransactionFilterTypesEnum.Expense]

  public totalBalance = '0';

  readonly reactiveKeywords = signal(['Groceries', 'Salary', 'Entertainment']);

  public transactionForm= this.fb.group({
      name: this.fb.nonNullable.control("", [Validators.required]),
      amount: this.fb.nonNullable.control("", [Validators.required]),
      date: this.fb.control(new Date().toISOString()),
      type: this.fb.control(TransactionFilterTypesEnum.Income),
      category: this.fb.control([])
    });
  public filterForm = this.fb.group({
    type: this.fb.control("")
  });
  dataSource: MatTableDataSource<Transaction> = new MatTableDataSource<Transaction>();
  columns = [
    'id',
    'date',
    'name',
    'amount',
    'type',
    'category',
    'createdOn',
    'actions',
  ];
  @ViewChild(MatSort) sort: MatSort | any;

// eslint-disable-next-line
  constructor() {}

  ngOnInit(): void {
    this.filterByType();
    this.getTransactionList$ = this.localStorageService.get('transactionlist').subscribe(
      (res: Transaction[]) => {
        this.dataSource = new MatTableDataSource(res);
        this.calculateIndexAndTotal(res);
      }
    );
  }

  ngOnDestroy(){
    this.getTransactionList$.unsubscribe();
    this.filterByType$.unsubscribe();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  calculateIndexAndTotal(res: Transaction[]){
    let sumIncome = 0;
    let sumExpenses = 0;
    if(res) {
      res.forEach((value: Transaction) => {
        if (value.type === "Income") {
          sumIncome += value.amount;
        }
        if (value.type === "Expense") {
          sumExpenses += value.amount;
        }
      })
      this.totalBalance = (sumIncome - sumExpenses).toFixed(2);
      this.index = res.length;
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }
  insertForm() {
    const transaction: Transaction = {
      id: this.index,
      date: new Date(
        this.DateControl.value
      ),
      name: this.NameControl.value,
      amount: this.AmountControl.value,
      type: this.TxTypeControl.value,
      category: this.CategoryControl.value,
      createdOn: new Date(),
    };
    this.dataSource.data = [transaction, ...this.dataSource.data];
    this.calculateIndexAndTotal(this.dataSource.data);
    this.localStorageService.set('transactionlist', this.dataSource.data).subscribe();
  }

  edit(transactionToEdit: Transaction) {
    this.NameControl.setValue(transactionToEdit.name);
    this.AmountControl.setValue(transactionToEdit.amount);
    this.TxTypeControl.setValue(transactionToEdit.type);
    this.CategoryControl.setValue(transactionToEdit.category);
    this.DateControl.setValue(new Date(transactionToEdit.date));
  }

  deleteElement(transaction: Transaction) {
    const dialogRef: MatDialogRef<unknown> = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Confirmation',
        message: 'This will delete the transaction. Are you sure?',
      },
    });
    dialogRef.afterClosed().subscribe((res: boolean) => {
        if (res) {
              this.dataSource.data = this.dataSource.data.filter(
                (v: Transaction) => v.id !== transaction.id
              );
          this.localStorageService.set('transactionlist', this.dataSource.data).subscribe();
          this.snackBar.open('Item Deleted', 'OK');
        }
      },
    );
  }

  get CategoryControl(): AbstractControl {
    return this.transactionForm.controls.category as AbstractControl;
  }

  get DateControl(): AbstractControl {
    return this.transactionForm.controls.date as AbstractControl;
  }

  get NameControl(): AbstractControl {
    return this.transactionForm.controls.name as AbstractControl;
  }

  get AmountControl(): AbstractControl {
    return this.transactionForm.controls.amount as AbstractControl;
  }

  get TxTypeControl(): AbstractControl {
    return this.transactionForm.controls.type as AbstractControl;
  }

  get FilterType(): AbstractControl {
    return this.filterForm.controls.type as AbstractControl;
  }

  removeReactiveKeyword(keyword: string) {
    this.reactiveKeywords.update(keywords => {
      const index = keywords.indexOf(keyword);
      if (index < 0) {
        return keywords;
      }
      keywords.splice(index, 1);
      this._liveAnnouncer.announce(`removed ${keyword} from reactive form`);
      return [...keywords];
    });
  }

  addReactiveKeyword(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.reactiveKeywords.update(keywords => [...keywords, value]);
      this._liveAnnouncer.announce(`added ${value} to reactive form`);
    }
    event.chipInput!.clear();
  }


  filterByType() {
    this.filterByType$ = this.FilterType.valueChanges.subscribe((positionValue) => {
      this.dataSource.filter = positionValue;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}

import { Component, OnInit} from '@angular/core';
import { ReportAnalysisService } from '../../services/report-analysis.service';
import { ReportService } from '../../services/report.service';
import { QuestionsService } from '../../services/questions.service';
import { ConfigService } from '../../services/config.service';
import { Title, DomSanitizer } from '@angular/platform-browser';
import { MaturityService } from '../../services/maturity.service';

@Component({
  selector: 'app-edm-commentsmarked',
  templateUrl: './edm-commentsmarked.component.html',
  styleUrls: ['../reports.scss', '../acet-reports.scss']
})
export class EdmCommentsmarkedComponent implements OnInit {
  response: any = null;

  loading: boolean = false;

  constructor(
  public analysisSvc: ReportAnalysisService,
  public reportSvc: ReportService,
  public questionsSvc: QuestionsService,
  public configSvc: ConfigService,
  private titleService: Title,
  public maturitySvc: MaturityService,
  private sanitizer: DomSanitizer
  ){}

  ngOnInit(): void {
    this.loading = true;
    this.titleService.setTitle("Comments Report - CISA EDM");

    this.maturitySvc.getCommentsMarked().subscribe(
      (r: any) => {
        this.response = r;
        this.loading = false;
      },
      error => console.log('Comments Marked Report Error: ' + (<Error>error).message)
    );
  }
  getQuestion(q){
    return q.split(/(?<=^\S+)\s/)[1];
  }
}

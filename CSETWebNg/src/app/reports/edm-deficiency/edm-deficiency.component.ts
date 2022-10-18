import { Component, OnInit } from '@angular/core';
import { ReportAnalysisService } from '../../services/report-analysis.service';
import { ReportService } from '../../services/report.service';
import { ConfigService } from '../../services/config.service';
import { Title, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MaturityService } from '../../services/maturity.service';
import { QuestionsService } from '../../services/questions.service';

@Component({
  selector: 'app-edm-deficiency',
  templateUrl: './edm-deficiency.component.html',
  styleUrls: ['../reports.scss', '../acet-reports.scss']
})
export class EdmDeficiencyComponent implements OnInit {
  response: any;

  loading: boolean = false;

  constructor(
    public analysisSvc: ReportAnalysisService,
      public reportSvc: ReportService,
      public configSvc: ConfigService,
      public questionsSvc: QuestionsService,
      private titleService: Title,
      public maturitySvc: MaturityService
    ) { }

    ngOnInit() {
      this.loading = true;
      this.titleService.setTitle("Deficiency Report - EDM");

      this.maturitySvc.getMaturityDeficiency("EDM").subscribe(
        (r: any) => {
          this.response = r;
          this.loading = false;
        },
        error => console.log('Deficiency Report Error: ' + (<Error>error).message)
      );
    }
    getQuestion(q){
      return q.split(/(?<=^\S+)\s/)[1];
    }
}

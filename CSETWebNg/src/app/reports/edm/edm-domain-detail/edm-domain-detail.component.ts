import { Component, Input, OnInit } from '@angular/core';
import { MaturityService } from '../../../services/maturity.service';
import { ConfigService } from '../../../services/config.service';
import { ReportService } from '../../../services/report.service';
import { LinebreakPipe } from '../../../helpers/linebreak.pipe';
import { QuestionsService } from '../../../services/questions.service';

@Component({
  selector: 'app-edm-domain-detail',
  templateUrl: './edm-domain-detail.component.html',
  styleUrls: ['../../reports.scss']
})
export class EdmDomainDetailComponent implements OnInit {


  @Input()
  domain: any;


  /**
   * 
   * @param configSvc 
   * @param maturitySvc 
   */
  constructor(
    public configSvc: ConfigService,
    public maturitySvc: MaturityService,
    public questionsSvc: QuestionsService,
    public reportSvc: ReportService
  ) { }


  ngOnInit() { 
  }

  /**
   * Sets the coloring of a cell based on its answer.
   * @param answer 
   */
  answerCellClass(answer: string) {
    switch (answer) {
      case 'Y':
        return 'green-score';
      case 'I':
        return 'yellow-score';
      case 'N':
        return 'red-score';
      case 'U':
        return 'default-score';
    }
  }

  /**
   * Actually, "non-child questions"
   * @param q 
   */
  parentQuestions(questionList: any[]) {
    return questionList.filter(x => !x.parentQuestionId);
  }

  /**
   * Until question numbers are broken out into their own data element,
   * we'll parse them from the question text.
   * @param q 
   */
  getQuestionNumber(q: any)
  {
    const dot = q.questionText.trim().indexOf('.');
    if (dot < 0) {
      return "Q";
    }
    return "Q" + q.questionText.trim().substring(0, dot);
  }

  /**
   * Looks up the Options For Consideration from the collection held by
   * the MaturityService.  
   * @param questionId 
   */
  getOfc(questionId: number) {
    if (!this.maturitySvc.ofc) {
      return '';
    }

    const questionOption = this.maturitySvc.ofc.find(x => x.mat_Question_Id == questionId);
    return questionOption.reference_Text;
  }

  /**
   * 
   * @returns 
   */
  getDomainRemark() {
    if (!!this.domain && !!this.domain.domainRemark)
    {
      return this.reportSvc.formatLinebreaks(this.domain.domainRemark);
    }

    return 'No remarks have been entered';
  }
}

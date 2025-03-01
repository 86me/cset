import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ConfigService } from '../../../services/config.service';
import { MaturityService } from '../../../services/maturity.service';
import { QuestionsService } from '../../../services/questions.service';
import { ReportAnalysisService } from '../../../services/report-analysis.service';
import { ReportService } from '../../../services/report.service';
import { RraDataService } from '../../../services/rra-data.service';

@Component({
  selector: 'app-rra-deficiency',
  templateUrl: './rra-deficiency.component.html',
  styleUrls: ['../../reports.scss', '../../acet-reports.scss']
})
export class RraDeficiencyComponent implements OnInit {

  response: any;

  loading: boolean = false;

  colorSchemeRed = { domain: ['#DC3545'] };
  xAxisTicks = [0, 25, 50, 75, 100];

  answerDistribByGoal = [];
  topRankedGoals = [];

  constructor(
    public analysisSvc: ReportAnalysisService,
    public reportSvc: ReportService,
    public configSvc: ConfigService,
    private titleService: Title,
    public maturitySvc: MaturityService,
    public questionsSvc: QuestionsService,
    public rraDataSvc: RraDataService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.titleService.setTitle("Deficiency Report - RRA");

    this.maturitySvc.getMaturityDeficiency("RRA").subscribe(
      (r: any) => {
        this.response = r;

        // sort the deficiencies by maturity level
        let basicList = [];
        let intermediateList = [];
        let advancedList = [];

        this.response.deficienciesList.forEach(element => {
          let level = this.getStringLevel(element.mat.maturity_Level_Id);
          switch (level) {
            case 'Basic':
              basicList.push(element);
              break;
            case 'Intermediate':
              intermediateList.push(element);
              break;
            case 'Advanced':
              advancedList.push(element);
              break;
          }
        });

        this.response.deficienciesList = basicList.concat(intermediateList).concat(advancedList);
        this.loading = false;
      },
      error => console.log('Deficiency Report Error: ' + (<Error>error).message)
    );


    this.rraDataSvc.getRRADetail().subscribe((r: any) => {
      this.createAnswerDistribByGoal(r);
      this.createTopRankedGoals(r);
    },
      error => console.log('RRA detail load Error: ' + (<Error>error).message)
    );
  }


  previous = 0;
  shouldDisplay(next) {
    if (next == this.previous) {
      return false;
    }
    else {
      this.previous = next;
      return true;
    }
  }

  /**
   *
   * @param levelNumber
   * @returns
   */
  getStringLevel(levelNumber: number) {
    //this should come from db eventually.
    var levelsList = {
      11: "Basic",
      12: "Intermediate",
      13: "Advanced"
    };
    return levelsList[levelNumber];
  }

  /**
   * Builds the answer distribution broken into goals.
   */
   createAnswerDistribByGoal(r: any) {
    let goalList = [];
    r.rraSummaryByGoal.forEach(element => {
      let goal = goalList.find(x => x.name == element.title);
      if (!goal) {
        goal = {
          name: element.title, series: [
            { name: 'Yes', value: 0 },
            { name: 'No', value: 0 },
            { name: 'Unanswered', value: 0 },
          ]
        };
        goalList.push(goal);
      }

      var p = goal.series.find(x => x.name == element.answer_Full_Name);
      p.value = element.percent;
    });

    this.answerDistribByGoal = goalList;
  }

  /**
   * Build a chart sorting the least-compliant goals to the top.
   * Must build answerDistribByGoal before calling this function.
   * @param r
   */
   createTopRankedGoals(r: any) {
    let goalList = [];
    this.answerDistribByGoal.forEach(element => {
      var yesPercent = element.series.find(x => x.name == 'Yes').value;
      var goal = {
        name: element.name, value: (100 - Math.round(yesPercent))
      };
      goalList.push(goal);
    });

    goalList.sort((a, b) => { return b.value - a.value; });

    this.topRankedGoals = goalList;
  }

  /**
   *
   * @param x
   * @returns
   */
  formatPercent(x: any) {
    return x + '%';
  }
}

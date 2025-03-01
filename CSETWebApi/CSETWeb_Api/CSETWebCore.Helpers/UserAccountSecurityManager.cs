﻿//////////////////////////////// 
// 
//   Copyright 2022 Battelle Energy Alliance, LLC  
// 
// 
//////////////////////////////// 
using CSETWebCore.DataLayer.Model;
using CSETWebCore.Model.Contact;
using CSETWebCore.Model.Password;
using CSETWebCore.Model.User;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using CSETWebCore.Interfaces.User;
using CSETWebCore.Interfaces.Notification;
using CSETWebCore.Model.Auth;

namespace CSETWebCore.Helpers
{
    public class UserAccountSecurityManager
    {
        private readonly CSETContext _context;
        private readonly IUserBusiness _userBusiness;
        private readonly INotificationBusiness _notificationBusiness;
        private readonly IConfiguration _configuration;

        // Password length limits
        public readonly int PasswordLengthMin = 13;
        public readonly int PasswordLengthMax = 50;

        // The number of old passwords that cannot be reused
        public readonly int NumberOfHistoricalPasswords = 24;

        /// <summary>
        /// 
        /// </summary>
        /// <param name="context"></param>
        public UserAccountSecurityManager(
            CSETContext context,
            IUserBusiness userBusiness,
            INotificationBusiness notificationBusiness,
            IConfiguration configuration)
        {
            _context = context;
            _userBusiness = userBusiness;
            _notificationBusiness = notificationBusiness;
            _configuration = configuration;
        }


        /// <summary>
        /// Creates a new user and sends them an email containing a temporary password.
        /// </summary>
        /// <param name="info"></param>
        /// <returns></returns>
        public bool CreateUserSendEmail(CreateUser info)
        {
            try
            {
                // Create the USER and USER_DETAIL_INFORMATION records for this new user
                var ud = new UserDetail()
                {
                    UserId = (int)info.UserId,
                    Email = info.PrimaryEmail,
                    FirstName = info.FirstName,
                    LastName = info.LastName
                };
                UserCreateResponse userCreateResponse = _userBusiness.CreateUser(ud, _context);

                _context.USER_SECURITY_QUESTIONS.Add(new USER_SECURITY_QUESTIONS()
                {
                    UserId = userCreateResponse.UserId,
                    SecurityQuestion1 = info.SecurityQuestion1,
                    SecurityQuestion2 = info.SecurityQuestion2,
                    SecurityAnswer1 = info.SecurityAnswer1,
                    SecurityAnswer2 = info.SecurityAnswer2
                });

                _context.SaveChanges();

                // Send the new temp password to the user
                _notificationBusiness.SendPasswordEmail(userCreateResponse.PrimaryEmail, info.FirstName, info.LastName, userCreateResponse.TemporaryPassword, info.AppCode);

                return true;
            }
            catch (ApplicationException app)
            {
                throw new Exception("This account already exists. Please request a new password using the Forgot Password link if you have forgotten your password.", app);
            }
            catch (DbUpdateException due)
            {
                throw new Exception("This account already exists. Please request a new password using the Forgot Password link if you have forgotten your password.", due);
            }
            catch (Exception exc)
            {
                log4net.LogManager.GetLogger(this.GetType()).Error($"... {exc}");

                return false;
            }
        }


        /// <summary>
        /// Changes the user's password and logs the new password in PASSWORD_HISTORY.
        /// 
        /// NOTE:  This method should not be called without first validating the password's 
        /// suitability against the password policy rules.
        /// </summary>
        /// <param name="changePass"></param>
        /// <returns></returns>
        public bool ChangePassword(ChangePassword changePass)
        {
            try
            {
                var user = _context.USERS.Where(x => x.PrimaryEmail == changePass.PrimaryEmail).FirstOrDefault();
                var info = _context.USER_DETAIL_INFORMATION.Where(x => x.PrimaryEmail == user.PrimaryEmail).FirstOrDefault();

                new PasswordHash().HashPassword(changePass.NewPassword, out string hash, out string salt);

                // update the password on the USERS record
                user.Password = hash;
                user.Salt = salt;
                user.PasswordResetRequired = false;


                // log the password to history
                var history = new PASSWORD_HISTORY()
                {
                    Created = DateTime.UtcNow,
                    UserId = user.UserId,
                    Is_Temp = false,
                    Password = hash,
                    Salt = salt
                };
                _context.PASSWORD_HISTORY.Add(history);

                _context.SaveChanges();

                // clean up
                CleanUpPasswordHistory(user.UserId, true);

                return true;
            }
            catch (Exception exc)
            {
                log4net.LogManager.GetLogger(this.GetType()).Error($"... {exc}");

                return false;
            }
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="email"></param>
        /// <param name="subject"></param>
        /// <param name="appCode"></param>
        /// <returns></returns>
        public bool ResetPassword(string email, string subject, string appCode)
        {
            /**
             * get the user and make sure they exist
             * set the reset password flag
             * generate the new password
             * send the email 
             * return 
             */
            try
            {
                var user = _context.USERS.Where(x => x.PrimaryEmail == email).FirstOrDefault();

                user.PasswordResetRequired = true;

                // generate a temp password
                var password = _userBusiness.CreateTempPassword();


#if DEBUG
                // set the password back to 'abc' for consistency/predictability when debugging
                if (user.PrimaryEmail == "a@b.com")
                {
                    password = "abc";
                }
#endif

                new PasswordHash().HashPassword(password, out string hash, out string salt);
                user.Password = hash;
                user.Salt = salt;


                // log the temp password to history
                var history = new PASSWORD_HISTORY()
                {
                    Created = DateTime.UtcNow,
                    UserId = user.UserId,
                    Is_Temp = true,
                    Password = hash,
                    Salt = salt
                };
                _context.PASSWORD_HISTORY.Add(history);


                _context.SaveChanges();


                CleanUpPasswordHistory(user.UserId, false);


                // send the notification email
                _notificationBusiness.SendPasswordResetEmail(user.PrimaryEmail, user.FirstName, user.LastName, password, subject, appCode);

                return true;
            }
            catch (Exception exc)
            {
                log4net.LogManager.GetLogger(this.GetType()).Error($"... {exc}");

                return false;
            }
        }


        /// <summary>
        /// Keeps the last 24 password history records and deletes the rest.
        /// </summary>
        /// <param name="userId"></param>
        private void CleanUpPasswordHistory(int userId, bool deleteTemps)
        {
            // delete temps
            if (deleteTemps)
            {
                var temps = _context.PASSWORD_HISTORY.Where(x => x.UserId == userId && x.Is_Temp).ToList();
                _context.PASSWORD_HISTORY.RemoveRange(temps);
            }


            // only keep the last 24 entries
            var last24 = _context.PASSWORD_HISTORY.Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Created)
                .Take(24).ToList().Select(x => x.Created);

            // build a list of any extraneous entries prior to the last 24 and delete them
            var deleteThese = _context.PASSWORD_HISTORY.Where(x => x.UserId == userId && !last24.Contains(x.Created)).ToList();
            _context.PASSWORD_HISTORY.RemoveRange(deleteThese);


            _context.SaveChanges();
        }


        /// <summary>
        /// Returns a list of potential security questions.
        /// </summary>
        /// <returns></returns>
        public List<PotentialQuestions> GetSecurityQuestionList()
        {
            List<PotentialQuestions> questions =
                (from a in _context.SECURITY_QUESTION
                 select new PotentialQuestions()
                 {
                     SecurityQuestion = a.SecurityQuestion,
                     SecurityQuestionId = a.SecurityQuestionId
                 }).ToList<PotentialQuestions>();
            return questions;
        }


        /// <summary>
        /// Checks the proposed password to see if it meets the 
        /// complexity rules and has not been used in the past 24 passwords.
        /// </summary>
        /// <param name="pw"></param>
        /// <returns></returns>
        public PasswordResponse ComplexityRulesMet(ChangePassword cp)
        {
            var resp = new PasswordResponse
            {
                PasswordLengthMin = PasswordLengthMin,
                PasswordLengthMax = PasswordLengthMax,
                NumberOfHistoricalPasswords = NumberOfHistoricalPasswords
            };


            // check to see if configured to bypass policy (for development)
            var bypassSection = _configuration.GetSection("BypassPasswordComplexityRules");
            bool.TryParse(bypassSection.Value, out bool bypass);
            if (bypass)
            {
                resp.PasswordLengthMet = true;
                resp.PasswordContainsLower = true;
                resp.PasswordContainsUpper = true;
                resp.PasswordContainsNumbers = true;
                resp.PasswordContainsSpecial = true;
                resp.PasswordNotReused = true;
                resp.IsValid = true;
                return resp;
            }


            var pw = cp.NewPassword;

            // can't be in the last 24 passwords (PASSWORD-HISTORY)
            resp.PasswordNotReused = IsPasswordInHistory(cp) ? false : true;
            resp.PasswordLengthMet =
                pw.Length < PasswordLengthMin || pw.Length > PasswordLengthMax ? false : true;
            resp.PasswordContainsNumbers = !Regex.IsMatch(pw, "[0-9].*[0-9]") ? false : true;
            resp.PasswordContainsLower = !Regex.IsMatch(pw, "[a-z]") ? false : true;
            resp.PasswordContainsUpper = !Regex.IsMatch(pw, "[A-Z]") ? false : true;
            resp.PasswordContainsSpecial =
                !Regex.IsMatch(pw, "[*.!@$%^&(){}\\[\\]:;<>,.?/~_+\\-=|]") ? false : true;

            return resp;
        }


        /// <summary>
        /// Looks at the most recent 24 historical passwords and tests the 
        /// proposed new password against them to see if it has been used before.
        /// 
        /// TODO: clean up any history records outside of the most recent 24.
        /// </summary>
        /// <param name="pw"></param>
        /// <param name="cp"></param>
        /// <returns></returns>
        private bool IsPasswordInHistory(ChangePassword cp)
        {
            var user = _context.USERS.Where(x => x.PrimaryEmail == cp.PrimaryEmail).First();
            var pwHash = new PasswordHash();

            var listPasswordHistory = _context.PASSWORD_HISTORY.Where(x => x.UserId == user.UserId)
                .OrderByDescending(y => y.Created)
                .Take(NumberOfHistoricalPasswords)
                .ToList();

            foreach (var hist in listPasswordHistory)
            {
                var passwordFound = pwHash.ValidatePassword(cp.NewPassword, hist.Password, hist.Salt);
                if (passwordFound)
                {
                    return true;
                }
            }

            return false;
        }
    }
}
